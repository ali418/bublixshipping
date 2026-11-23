'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.ENUM(
      'SUPER_ADMIN',
      'ADMIN',
      'BRANCH_MANAGER',
      'STAFF',
      'ACCOUNTANT',
      'DRIVER',
      'MERCHANT',
      'CUSTOMER'
    ),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Roles',
  timestamps: true,
});

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'MANAGE'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Permissions',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['resource', 'action'] },
  ],
});

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Roles', key: 'id' },
  },
  permissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Permissions', key: 'id' },
  },
}, {
  tableName: 'RolePermissions',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['roleId', 'permissionId'] },
  ],
});

module.exports = { Role, Permission, RolePermission };
