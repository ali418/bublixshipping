'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      hubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, defaultValue: '' },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING },
      passwordHash: { type: Sequelize.STRING, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      isEmailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      language: { type: Sequelize.STRING(5), defaultValue: 'en' },
      lastLoginAt: { type: Sequelize.DATE },
      passwordChangedAt: { type: Sequelize.DATE },
      passwordResetToken: { type: Sequelize.STRING },
      passwordResetExpires: { type: Sequelize.DATE },
      deletedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['organizationId']);

    await queryInterface.createTable('UserRoles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      roleId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Roles', key: 'id' }, onDelete: 'CASCADE' },
    });
    await queryInterface.addIndex('UserRoles', ['userId', 'roleId'], { unique: true });

    await queryInterface.createTable('RefreshTokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      token: { type: Sequelize.TEXT, allowNull: false, unique: true },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      isRevoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      ipAddress: { type: Sequelize.STRING(45) },
      userAgent: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RefreshTokens');
    await queryInterface.dropTable('UserRoles');
    await queryInterface.dropTable('Users');
  },
};
