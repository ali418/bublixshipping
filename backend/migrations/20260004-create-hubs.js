'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Hubs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      countryId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Countries', key: 'id' } },
      cityId: { type: Sequelize.UUID, references: { model: 'Cities', key: 'id' } },
      name: { type: Sequelize.STRING, allowNull: false },
      nameAr: { type: Sequelize.STRING },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      hubType: { type: Sequelize.ENUM('BRANCH', 'WAREHOUSE', 'HUB'), defaultValue: 'BRANCH' },
      address: { type: Sequelize.TEXT },
      phone: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      timezone: { type: Sequelize.STRING, defaultValue: 'Africa/Kampala' },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      isHeadquarters: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('Hubs', ['organizationId']);
    await queryInterface.addIndex('Hubs', ['code']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Hubs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Hubs_hubType"');
  },
};
