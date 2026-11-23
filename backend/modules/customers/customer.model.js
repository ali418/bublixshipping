'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Customer = sequelize.define('Customer', {
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
  customerType: {
    type: DataTypes.ENUM('INDIVIDUAL', 'BUSINESS'),
    defaultValue: 'INDIVIDUAL',
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Countries', key: 'id' },
  },
  cityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Cities', key: 'id' },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isMerchant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.CHAR(3),
    defaultValue: 'USD',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Customers',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['phone'] },
    { fields: ['email'] },
    { fields: ['organizationId'] },
  ],
});

const CustomerAddress = sequelize.define('CustomerAddress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Customers', key: 'id' },
  },
  label: {
    type: DataTypes.STRING,
    defaultValue: 'Home',
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Countries', key: 'id' },
  },
  cityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Cities', key: 'id' },
  },
  addressLine1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  addressLine2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'CustomerAddresses',
  timestamps: true,
});

const MerchantProfile = sequelize.define('MerchantProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'Customers', key: 'id' },
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contractNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  paymentTermDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  apiEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'MerchantProfiles',
  timestamps: true,
});

module.exports = { Customer, CustomerAddress, MerchantProfile };
