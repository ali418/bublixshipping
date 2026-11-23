'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Roles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      name: {
        type: Sequelize.ENUM('SUPER_ADMIN','ADMIN','BRANCH_MANAGER','STAFF','ACCOUNTANT','DRIVER','MERCHANT','CUSTOMER'),
        allowNull: false, unique: true,
      },
      description: { type: Sequelize.TEXT },
      isSystem: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('Permissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      resource: { type: Sequelize.STRING, allowNull: false },
      action: { type: Sequelize.ENUM('CREATE','READ','UPDATE','DELETE','APPROVE','MANAGE'), allowNull: false },
      description: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('Permissions', ['resource', 'action'], { unique: true });

    await queryInterface.createTable('RolePermissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      roleId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Roles', key: 'id' }, onDelete: 'CASCADE' },
      permissionId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Permissions', key: 'id' }, onDelete: 'CASCADE' },
    });
    await queryInterface.addIndex('RolePermissions', ['roleId', 'permissionId'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RolePermissions');
    await queryInterface.dropTable('Permissions');
    await queryInterface.dropTable('Roles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Roles_name"; DROP TYPE IF EXISTS "enum_Permissions_action"');
  },
};
