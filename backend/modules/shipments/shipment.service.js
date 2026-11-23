'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { sequelize, Shipment, ShipmentItem, ShipmentEvent, ShipmentCharge, Customer, Hub, Country, ShippingService } = require('../index');

/**
 * Generate unique tracking number: BBLX-XXXXXX
 */
const generateTrackingNumber = async (prefix = 'BBLX') => {
  let trackingNumber;
  let isUnique = false;

  while (!isUnique) {
    const random = Math.random().toString(36).toUpperCase().slice(2, 8).padEnd(6, '0');
    trackingNumber = `${prefix}-${random}`;

    const existing = await Shipment.findOne({ where: { trackingNumber } });
    if (!existing) isUnique = true;
  }

  return trackingNumber;
};

/**
 * Calculate chargeable weight
 */
const calculateChargeableWeight = (actualWeight, dimensions, divisor = 5000) => {
  let volumetricWeight = null;

  if (dimensions && dimensions.length && dimensions.width && dimensions.height) {
    volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / divisor;
  }

  const chargeableWeight = volumetricWeight
    ? Math.max(actualWeight, volumetricWeight)
    : actualWeight;

  return { volumetricWeight, chargeableWeight };
};

/**
 * Create shipment (full transaction)
 */
const createShipment = async (data, createdBy, organizationId) => {
  const transaction = await sequelize.transaction();

  try {
    const { volumetricWeight, chargeableWeight } = calculateChargeableWeight(
      data.actualWeight,
      data.dimensions,
      data.volumetricDivisor
    );

    const trackingNumber = await generateTrackingNumber(data.trackingPrefix || 'BBLX');

    const totalAmount =
      (parseFloat(data.shippingCost) || 0) +
      (parseFloat(data.additionalCharges) || 0) -
      (parseFloat(data.discountAmount) || 0);

    const shipment = await Shipment.create(
      {
        organizationId,
        trackingNumber,
        shipmentType: data.shipmentType,
        serviceTypeId: data.serviceTypeId,
        senderCustomerId: data.senderCustomerId || null,
        senderNameSnapshot: data.senderName,
        senderPhoneSnapshot: data.senderPhone,
        senderAddressSnapshot: data.senderAddress || null,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        receiverEmail: data.receiverEmail || null,
        receiverAddress: data.receiverAddress || null,
        originCountryId: data.originCountryId,
        destinationCountryId: data.destinationCountryId,
        originHubId: data.originHubId,
        destinationHubId: data.destinationHubId,
        currentHubId: data.originHubId,
        actualWeight: data.actualWeight,
        volumetricWeight,
        chargeableWeight,
        totalPieces: data.totalPieces || 1,
        declaredValue: data.declaredValue || null,
        declaredCurrency: data.declaredCurrency || null,
        dimensions: data.dimensions || null,
        shippingCost: data.shippingCost,
        additionalCharges: data.additionalCharges || 0,
        discountAmount: data.discountAmount || 0,
        totalAmount,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod,
        paymentStatus: 'PENDING',
        codAmount: data.codAmount || 0,
        codCurrency: data.codCurrency || null,
        shipmentStatus: 'CREATED',
        estimatedDeliveryDate: data.estimatedDeliveryDate || null,
        specialInstructions: data.specialInstructions || null,
        // International
        incoterm: data.incoterm || null,
        customsValue: data.customsValue || null,
        customsCurrency: data.customsCurrency || null,
        createdBy,
      },
      { transaction }
    );

    // Create shipment items
    if (data.items && data.items.length > 0) {
      await ShipmentItem.bulkCreate(
        data.items.map((item) => ({ ...item, shipmentId: shipment.id })),
        { transaction }
      );
    }

    // Create initial tracking event
    await ShipmentEvent.create(
      {
        shipmentId: shipment.id,
        status: 'CREATED',
        hubId: data.originHubId,
        location: null,
        notes: 'Shipment created',
        isPublic: true,
        recordedBy: createdBy,
        eventTime: new Date(),
      },
      { transaction }
    );

    // Create shipping charge record
    await ShipmentCharge.create(
      {
        shipmentId: shipment.id,
        chargeType: 'SHIPPING',
        description: 'Base shipping charge',
        amount: data.shippingCost,
        currency: data.currency || 'USD',
        isIncludedInTotal: true,
        addedBy: createdBy,
      },
      { transaction }
    );

    await transaction.commit();

    return shipment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Add tracking event (with status transition validation)
 */
const VALID_TRANSITIONS = {
  CREATED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['AT_ORIGIN_HUB', 'CANCELLED'],
  AT_ORIGIN_HUB: ['IN_TRANSIT', 'ON_HOLD', 'CANCELLED'],
  IN_TRANSIT: ['AT_DESTINATION_HUB', 'CUSTOMS_CLEARANCE', 'ON_HOLD'],
  CUSTOMS_CLEARANCE: ['AT_DESTINATION_HUB', 'ON_HOLD'],
  AT_DESTINATION_HUB: ['OUT_FOR_DELIVERY', 'ON_HOLD'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'ON_HOLD'],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'RETURNED', 'ON_HOLD'],
  ON_HOLD: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RETURNED', 'CANCELLED'],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

const addTrackingEvent = async (shipmentId, newStatus, eventData, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const shipment = await Shipment.findByPk(shipmentId, { transaction });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    const allowedNextStatuses = VALID_TRANSITIONS[shipment.shipmentStatus] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${shipment.shipmentStatus} to ${newStatus}. Allowed: ${allowedNextStatuses.join(', ')}`
      );
    }

    // Update shipment status
    const updateData = { shipmentStatus: newStatus };
    if (newStatus === 'DELIVERED') {
      updateData.actualDeliveryDate = new Date();
    }

    await shipment.update(updateData, { transaction });

    // Insert new event
    const event = await ShipmentEvent.create(
      {
        shipmentId,
        status: newStatus,
        hubId: eventData.hubId || null,
        location: eventData.location || null,
        notes: eventData.notes || null,
        isPublic: eventData.isPublic !== undefined ? eventData.isPublic : true,
        recordedBy: userId,
        eventTime: eventData.eventTime || new Date(),
        metadata: eventData.metadata || null,
      },
      { transaction }
    );

    await transaction.commit();

    // Fire notification async after commit — non-blocking
    setImmediate(async () => {
      try {
        const { sendShipmentNotification } = require('../notifications/notification.service');
        const updatedShipment = await Shipment.findByPk(shipmentId);
        if (updatedShipment) {
          await sendShipmentNotification(updatedShipment.toJSON(), newStatus, eventData.notes);
        }
      } catch (_) { /* notifications are best-effort */ }
    });

    return { shipment, event };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Public tracking — only safe fields
 */
const getPublicTracking = async (trackingNumber) => {
  const shipment = await Shipment.findOne({
    where: { trackingNumber },
    attributes: [
      'id', 'trackingNumber', 'shipmentType', 'shipmentStatus',
      'estimatedDeliveryDate', 'actualDeliveryDate', 'totalPieces',
    ],
    include: [
      {
        model: ShipmentEvent,
        as: 'events',
        where: { isPublic: true },
        required: false,
        attributes: ['status', 'location', 'notes', 'eventTime'],
        order: [['eventTime', 'ASC']],
      },
      { model: Country, as: 'originCountry', attributes: ['name', 'code'] },
      { model: Country, as: 'destinationCountry', attributes: ['name', 'code'] },
      { model: Hub, as: 'originHub', attributes: ['name', 'code'] },
      { model: Hub, as: 'destinationHub', attributes: ['name', 'code'] },
    ],
  });

  if (!shipment) return null;

  return {
    trackingNumber: shipment.trackingNumber,
    shipmentType: shipment.shipmentType,
    status: shipment.shipmentStatus,
    totalPieces: shipment.totalPieces,
    origin: {
      country: shipment.originCountry,
      hub: shipment.originHub,
    },
    destination: {
      country: shipment.destinationCountry,
      hub: shipment.destinationHub,
    },
    estimatedDelivery: shipment.estimatedDeliveryDate,
    deliveredAt: shipment.actualDeliveryDate,
    timeline: shipment.events,
  };
};

module.exports = {
  createShipment,
  addTrackingEvent,
  getPublicTracking,
  generateTrackingNumber,
  calculateChargeableWeight,
  VALID_TRANSITIONS,
};
