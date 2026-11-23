'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameAr: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    defaultValue: 'https://bublixshipping.com',
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  defaultCurrency: {
    type: DataTypes.CHAR(3),
    defaultValue: 'USD',
  },
  defaultTimezone: {
    type: DataTypes.STRING,
    defaultValue: 'Africa/Kampala',
  },
  defaultLanguage: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
  },
  trackingPrefix: {
    type: DataTypes.STRING(10),
    defaultValue: 'BBLX',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'Organizations',
  timestamps: true,
});

module.exports = Organization;
