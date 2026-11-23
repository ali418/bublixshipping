'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Invoice = sequelize.define('Invoice', {
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
  hubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Customers', key: 'id' },
  },
  invoiceType: {
    type: DataTypes.ENUM('SHIPMENT', 'COD_SETTLEMENT', 'STATEMENT', 'CREDIT_NOTE'),
    defaultValue: 'SHIPMENT',
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'WRITTEN_OFF'),
    defaultValue: 'DRAFT',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  taxAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  currency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  issueDate: { type: DataTypes.DATEONLY, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'Invoices',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['invoiceNumber'] },
    { fields: ['customerId'] },
    { fields: ['status'] },
  ],
});

const Payment = sequelize.define('Payment', {
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
  hubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Customers', key: 'id' },
  },
  referenceNumber: { type: DataTypes.STRING, allowNull: true },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT'),
    allowNull: false,
  },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  exchangeRate: { type: DataTypes.DECIMAL(16, 6), defaultValue: 1 },
  baseAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  baseCurrency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED', 'REVERSED'),
    defaultValue: 'PENDING',
  },
  proofUrl: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  recordedBy: { type: DataTypes.UUID, allowNull: true },
  verifiedBy: { type: DataTypes.UUID, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'Payments',
  timestamps: true,
  indexes: [
    { fields: ['customerId'] },
    { fields: ['status'] },
    { fields: ['paymentDate'] },
  ],
});

const PaymentAllocation = sequelize.define('PaymentAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Payments', key: 'id' },
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Invoices', key: 'id' },
  },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
}, {
  tableName: 'PaymentAllocations',
  timestamps: true,
  updatedAt: false,
});

const CODCollection = sequelize.define('CODCollection', {
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
  collectedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  collectedAt: { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.ENUM('COLLECTED', 'SUBMITTED', 'SETTLED', 'DISPUTED'),
    defaultValue: 'COLLECTED',
  },
  settledAt: { type: DataTypes.DATE, allowNull: true },
  settledBy: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'CODCollections',
  timestamps: true,
  indexes: [
    { fields: ['shipmentId'] },
    { fields: ['driverId'] },
    { fields: ['status'] },
  ],
});

module.exports = { Invoice, Payment, PaymentAllocation, CODCollection };
