'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ShippingServices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      name: { type: Sequelize.STRING, allowNull: false },
      nameAr: { type: Sequelize.STRING },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      serviceType: { type: Sequelize.ENUM('AIR','SEA','LAND','EXPRESS','LOCAL'), allowNull: false },
      shipmentScope: { type: Sequelize.ENUM('DOMESTIC','INTERNATIONAL','BOTH'), defaultValue: 'BOTH' },
      volumetricDivisor: { type: Sequelize.DECIMAL(10, 2), defaultValue: 5000 },
      estimatedDaysMin: { type: Sequelize.INTEGER },
      estimatedDaysMax: { type: Sequelize.INTEGER },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      sortOrder: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('PricingRules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      serviceId: { type: Sequelize.UUID, allowNull: false, references: { model: 'ShippingServices', key: 'id' } },
      name: { type: Sequelize.STRING, allowNull: false },
      originCountryId: { type: Sequelize.UUID, references: { model: 'Countries', key: 'id' } },
      destinationCountryId: { type: Sequelize.UUID, references: { model: 'Countries', key: 'id' } },
      originHubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      destinationHubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      pricingMethod: { type: Sequelize.ENUM('PER_KG','FLAT_RATE','PER_CBM','ZONE_BASED'), allowNull: false },
      baseRate: { type: Sequelize.DECIMAL(10, 4), allowNull: false },
      minimumCharge: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      weightBreaks: { type: Sequelize.JSONB, defaultValue: [] },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      validFrom: { type: Sequelize.DATE },
      validTo: { type: Sequelize.DATE },
      priority: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('CurrencyRates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      fromCurrency: { type: Sequelize.CHAR(3), allowNull: false },
      toCurrency: { type: Sequelize.CHAR(3), allowNull: false },
      rate: { type: Sequelize.DECIMAL(16, 6), allowNull: false },
      effectiveDate: { type: Sequelize.DATEONLY, allowNull: false },
      setBy: { type: Sequelize.UUID },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('CurrencyRates', ['fromCurrency', 'toCurrency', 'effectiveDate']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('CurrencyRates');
    await queryInterface.dropTable('PricingRules');
    await queryInterface.dropTable('ShippingServices');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_ShippingServices_serviceType";
      DROP TYPE IF EXISTS "enum_ShippingServices_shipmentScope";
      DROP TYPE IF EXISTS "enum_PricingRules_pricingMethod";
    `);
  },
};
