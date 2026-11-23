'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const ShippingService = sequelize.define('ShippingService', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameAr: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  serviceType: {
    type: DataTypes.ENUM('AIR', 'SEA', 'LAND', 'EXPRESS', 'LOCAL'),
    allowNull: false,
  },
  shipmentScope: {
    type: DataTypes.ENUM('DOMESTIC', 'INTERNATIONAL', 'BOTH'),
    defaultValue: 'BOTH',
  },
  volumetricDivisor: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 5000,
    comment: 'L x W x H / divisor = volumetric weight in kg',
  },
  estimatedDaysMin: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  estimatedDaysMax: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'ShippingServices',
  timestamps: true,
});

const PricingRule = sequelize.define('PricingRule', {
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
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'ShippingServices', key: 'id' },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originCountryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Countries', key: 'id' },
  },
  destinationCountryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Countries', key: 'id' },
  },
  originHubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },
  destinationHubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Hubs', key: 'id' },
  },
  pricingMethod: {
    type: DataTypes.ENUM('PER_KG', 'FLAT_RATE', 'PER_CBM', 'ZONE_BASED'),
    allowNull: false,
  },
  baseRate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
  },
  minimumCharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.CHAR(3),
    defaultValue: 'USD',
  },
  weightBreaks: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of {upTo, rate} for tiered weight pricing',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  validTo: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'PricingRules',
  timestamps: true,
});

const CurrencyRate = sequelize.define('CurrencyRate', {
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
  fromCurrency: {
    type: DataTypes.CHAR(3),
    allowNull: false,
  },
  toCurrency: {
    type: DataTypes.CHAR(3),
    allowNull: false,
  },
  rate: {
    type: DataTypes.DECIMAL(16, 6),
    allowNull: false,
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  setBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'CurrencyRates',
  timestamps: true,
  indexes: [
    { fields: ['fromCurrency', 'toCurrency', 'effectiveDate'] },
  ],
});

module.exports = { ShippingService, PricingRule, CurrencyRate };
