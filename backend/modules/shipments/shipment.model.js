'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Organizations', key: 'id' },
  },
  trackingNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  shipmentType: {
    type: DataTypes.ENUM('DOMESTIC', 'INTERNATIONAL'),
    allowNull: false,
  },
  serviceTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'ShippingServices', key: 'id' },
  },

  // Sender
  senderCustomerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Customers', key: 'id' },
  },
  senderNameSnapshot: { type: DataTypes.STRING, allowNull: false },
  senderPhoneSnapshot: { type: DataTypes.STRING, allowNull: false },
  senderAddressSnapshot: { type: DataTypes.JSONB, allowNull: true },

  // Receiver
  receiverName: { type: DataTypes.STRING, allowNull: false },
  receiverPhone: { type: DataTypes.STRING, allowNull: false },
  receiverEmail: { type: DataTypes.STRING, allowNull: true },
  receiverAddress: { type: DataTypes.JSONB, allowNull: true },

  // Routing
  originCountryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Countries', key: 'id' },
  },
  destinationCountryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Countries', key: 'id' },
  },
  originHubId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Hubs', key: 'id' },
  },
  destinationHubId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Hubs', key: 'id' },
  },
  currentHubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },

  // Package
  actualWeight: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  volumetricWeight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
  chargeableWeight: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  totalPieces: { type: DataTypes.INTEGER, defaultValue: 1 },
  declaredValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  declaredCurrency: { type: DataTypes.CHAR(3), allowNull: true },
  dimensions: { type: DataTypes.JSONB, allowNull: true },

  // Financial
  shippingCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  additionalCharges: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'COD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT'),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED'),
    defaultValue: 'PENDING',
  },
  codAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  codCurrency: { type: DataTypes.CHAR(3), allowNull: true },

  // Status
  shipmentStatus: {
    type: DataTypes.ENUM(
      'CREATED',
      'PICKED_UP',
      'AT_ORIGIN_HUB',
      'IN_TRANSIT',
      'AT_DESTINATION_HUB',
      'CUSTOMS_CLEARANCE',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'ON_HOLD',
      'DELIVERY_FAILED',
      'RETURNED',
      'CANCELLED'
    ),
    defaultValue: 'CREATED',
  },
  estimatedDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
  actualDeliveryDate: { type: DataTypes.DATE, allowNull: true },
  specialInstructions: { type: DataTypes.TEXT, allowNull: true },

  // International fields
  customsStatus: { type: DataTypes.STRING, allowNull: true },
  customsReference: { type: DataTypes.STRING, allowNull: true },
  customsValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  customsCurrency: { type: DataTypes.CHAR(3), allowNull: true },
  customsClearanceNotes: { type: DataTypes.TEXT, allowNull: true },
  incoterm: { type: DataTypes.STRING(10), allowNull: true },

  // Meta
  createdBy: { type: DataTypes.UUID, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
  cancelledBy: { type: DataTypes.UUID, allowNull: true },
  cancellationReason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'Shipments',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['trackingNumber'] },
    { fields: ['shipmentStatus'] },
    { fields: ['originHubId'] },
    { fields: ['destinationHubId'] },
    { fields: ['senderCustomerId'] },
    { fields: ['createdAt'] },
    { fields: ['organizationId'] },
  ],
});

const ShipmentItem = sequelize.define('ShipmentItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Shipments', key: 'id' },
  },
  description: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  weight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
  length: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  width: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  height: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  unitValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  currency: { type: DataTypes.CHAR(3), allowNull: true },
  hsCode: { type: DataTypes.STRING(20), allowNull: true },
  barcode: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'ShipmentItems',
  timestamps: true,
});

const ShipmentEvent = sequelize.define('ShipmentEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Shipments', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM(
      'CREATED',
      'PICKED_UP',
      'AT_ORIGIN_HUB',
      'IN_TRANSIT',
      'AT_DESTINATION_HUB',
      'CUSTOMS_CLEARANCE',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'ON_HOLD',
      'DELIVERY_FAILED',
      'RETURNED',
      'CANCELLED'
    ),
    allowNull: false,
  },
  hubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },
  location: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
  recordedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
  },
  eventTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  metadata: { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'ShipmentEvents',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['shipmentId'] },
    { fields: ['status'] },
    { fields: ['eventTime'] },
  ],
});

const ShipmentAssignment = sequelize.define('ShipmentAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Shipments', key: 'id' },
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
  },
  hubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },
  assignmentType: {
    type: DataTypes.ENUM('PICKUP', 'DELIVERY', 'TRANSFER'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'),
    defaultValue: 'PENDING',
  },
  assignedBy: { type: DataTypes.UUID, allowNull: true },
  scheduledDate: { type: DataTypes.DATEONLY, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'ShipmentAssignments',
  timestamps: true,
});

const ShipmentCharge = sequelize.define('ShipmentCharge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Shipments', key: 'id' },
  },
  chargeType: {
    type: DataTypes.ENUM(
      'SHIPPING',
      'CUSTOMS',
      'HANDLING',
      'INSURANCE',
      'COD_FEE',
      'FUEL_SURCHARGE',
      'REMOTE_AREA',
      'OVERSIZE',
      'OTHER'
    ),
    allowNull: false,
  },
  description: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  isIncludedInTotal: { type: DataTypes.BOOLEAN, defaultValue: true },
  addedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'ShipmentCharges',
  timestamps: true,
});

const DeliveryProof = sequelize.define('DeliveryProof', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'Shipments', key: 'id' },
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
  },
  recipientName: { type: DataTypes.STRING, allowNull: false },
  recipientRelation: { type: DataTypes.STRING, allowNull: true },
  signatureUrl: { type: DataTypes.STRING, allowNull: true },
  photoUrl: { type: DataTypes.STRING, allowNull: true },
  deliveredAt: { type: DataTypes.DATE, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  gpsCoordinates: { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'DeliveryProofs',
  timestamps: true,
  updatedAt: false,
});

module.exports = {
  Shipment,
  ShipmentItem,
  ShipmentEvent,
  ShipmentAssignment,
  ShipmentCharge,
  DeliveryProof,
};
