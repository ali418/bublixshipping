'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Organizations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      nameAr: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING },
      address: { type: Sequelize.TEXT },
      website: { type: Sequelize.STRING },
      logoUrl: { type: Sequelize.STRING },
      defaultCurrency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      defaultTimezone: { type: Sequelize.STRING, defaultValue: 'Africa/Kampala' },
      defaultLanguage: { type: Sequelize.STRING(5), defaultValue: 'en' },
      trackingPrefix: { type: Sequelize.STRING(10), defaultValue: 'BBLX' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      settings: { type: Sequelize.JSONB, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Organizations');
  },
};
