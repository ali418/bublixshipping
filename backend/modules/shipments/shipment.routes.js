'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize, enforceBranchAccess } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const shipmentService = require('./shipment.service');
const { Shipment, ShipmentEvent, ShipmentItem, Customer, Hub, Country, ShippingService, User } = require('../index');
const { Op } = require('sequelize');

// ─── List Shipments ────────────────────────────────────────────────────────────
router.get('/', authenticate, enforceBranchAccess, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, search, startDate, endDate, hubId, shipmentType } = req.query;

    const where = { organizationId: req.user.organizationId };

    if (status) where.shipmentStatus = status;
    if (shipmentType) where.shipmentType = shipmentType;
    if (hubId) where[Op.or] = [{ originHubId: hubId }, { destinationHubId: hubId }];
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    if (search) {
      where[Op.or] = [
        { trackingNumber: { [Op.iLike]: `%${search}%` } },
        { receiverName: { [Op.iLike]: `%${search}%` } },
        { receiverPhone: { [Op.iLike]: `%${search}%` } },
        { senderNameSnapshot: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Shipment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Country, as: 'originCountry', attributes: ['name', 'code'] },
        { model: Country, as: 'destinationCountry', attributes: ['name', 'code'] },
        { model: Hub, as: 'originHub', attributes: ['name', 'code'] },
        { model: Hub, as: 'destinationHub', attributes: ['name', 'code'] },
        { model: ShippingService, as: 'service', attributes: ['name', 'serviceType'] },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (error) {
    console.error(error);
    return res.error('Failed to list shipments', 500);
  }
});

// ─── Create Shipment ───────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF'), async (req, res) => {
  try {
    const shipment = await shipmentService.createShipment(
      req.body,
      req.user.id,
      req.user.organizationId
    );

    return res.success({ trackingNumber: shipment.trackingNumber, shipmentId: shipment.id }, 'Shipment created successfully', 201);
  } catch (error) {
    console.error(error);
    return res.error(error.message || 'Failed to create shipment', 400);
  }
});

// ─── Get Shipment Detail ───────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [
        { model: ShipmentItem, as: 'items' },
        {
          model: ShipmentEvent,
          as: 'events',
          order: [['eventTime', 'ASC']],
          include: [{ model: User, as: 'recorder', attributes: ['firstName', 'lastName'] }],
        },
        { model: Country, as: 'originCountry', attributes: ['name', 'code'] },
        { model: Country, as: 'destinationCountry', attributes: ['name', 'code'] },
        { model: Hub, as: 'originHub', attributes: ['name', 'code'] },
        { model: Hub, as: 'destinationHub', attributes: ['name', 'code'] },
        { model: ShippingService, as: 'service' },
        { model: Customer, as: 'sender', attributes: ['firstName', 'lastName', 'phone', 'email'] },
      ],
    });

    if (!shipment) return res.error('Shipment not found', 404);

    return res.success({ shipment });
  } catch (error) {
    console.error(error);
    return res.error('Failed to get shipment', 500);
  }
});

// ─── Add Tracking Event ────────────────────────────────────────────────────────
router.post('/:id/events', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF', 'DRIVER'), async (req, res) => {
  try {
    const { status, notes, location, hubId, isPublic } = req.body;

    if (!status) return res.error('Status is required', 400);

    const result = await shipmentService.addTrackingEvent(
      req.params.id,
      status,
      { notes, location, hubId, isPublic },
      req.user.id
    );

    return res.success(result, 'Tracking event added successfully');
  } catch (error) {
    console.error(error);
    return res.error(error.message || 'Failed to add event', 400);
  }
});

// ─── Public Tracking ───────────────────────────────────────────────────────────
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const data = await shipmentService.getPublicTracking(req.params.trackingNumber);

    if (!data) return res.error('Shipment not found', 404);

    return res.success(data);
  } catch (error) {
    console.error(error);
    return res.error('Failed to track shipment', 500);
  }
});

// ─── Cancel Shipment ───────────────────────────────────────────────────────────
router.post('/:id/cancel', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await shipmentService.addTrackingEvent(
      req.params.id,
      'CANCELLED',
      { notes: reason || 'Shipment cancelled' },
      req.user.id
    );

    await result.shipment.update({
      cancelledAt: new Date(),
      cancelledBy: req.user.id,
      cancellationReason: reason || null,
    });

    return res.success(null, 'Shipment cancelled successfully');
  } catch (error) {
    console.error(error);
    return res.error(error.message || 'Failed to cancel shipment', 400);
  }
});

module.exports = router;
