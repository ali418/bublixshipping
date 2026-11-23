'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Country = sequelize.define('Country', {
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
  code: {
    type: DataTypes.CHAR(2),
    allowNull: false,
    unique: true,
  },
  dialCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  currency: {
    type: DataTypes.CHAR(3),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Countries',
  timestamps: true,
});

const City = sequelize.define('City', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Countries', key: 'id' },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameAr: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Cities',
  timestamps: true,
});

const Hub = sequelize.define('Hub', {
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
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Countries', key: 'id' },
  },
  cityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Cities', key: 'id' },
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
  hubType: {
    type: DataTypes.ENUM('BRANCH', 'WAREHOUSE', 'HUB'),
    defaultValue: 'BRANCH',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'Africa/Kampala',
  },
  currency: {
    type: DataTypes.CHAR(3),
    defaultValue: 'USD',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isHeadquarters: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'Hubs',
  timestamps: true,
});

module.exports = { Country, City, Hub };
