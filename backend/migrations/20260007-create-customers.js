'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Customers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      customerType: { type: Sequelize.ENUM('INDIVIDUAL','BUSINESS'), defaultValue: 'INDIVIDUAL' },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, defaultValue: '' },
      companyName: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING, allowNull: false },
      phone2: { type: Sequelize.STRING },
      countryId: { type: Sequelize.UUID, references: { model: 'Countries', key: 'id' } },
      cityId: { type: Sequelize.UUID, references: { model: 'Cities', key: 'id' } },
      address: { type: Sequelize.TEXT },
      taxNumber: { type: Sequelize.STRING },
      notes: { type: Sequelize.TEXT },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      isMerchant: { type: Sequelize.BOOLEAN, defaultValue: false },
      balance: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      createdBy: { type: Sequelize.UUID },
      deletedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('Customers', ['phone']);
    await queryInterface.addIndex('Customers', ['organizationId']);

    await queryInterface.createTable('CustomerAddresses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      customerId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Customers', key: 'id' }, onDelete: 'CASCADE' },
      label: { type: Sequelize.STRING, defaultValue: 'Home' },
      countryId: { type: Sequelize.UUID, references: { model: 'Countries', key: 'id' } },
      cityId: { type: Sequelize.UUID, references: { model: 'Cities', key: 'id' } },
      addressLine1: { type: Sequelize.STRING, allowNull: false },
      addressLine2: { type: Sequelize.STRING },
      postalCode: { type: Sequelize.STRING },
      isDefault: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('MerchantProfiles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      customerId: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'Customers', key: 'id' }, onDelete: 'CASCADE' },
      businessName: { type: Sequelize.STRING, allowNull: false },
      businessType: { type: Sequelize.STRING },
      contractNumber: { type: Sequelize.STRING },
      discountPercentage: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      creditLimit: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      paymentTermDays: { type: Sequelize.INTEGER, defaultValue: 0 },
      isApproved: { type: Sequelize.BOOLEAN, defaultValue: false },
      apiEnabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('MerchantProfiles');
    await queryInterface.dropTable('CustomerAddresses');
    await queryInterface.dropTable('Customers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Customers_customerType"');
  },
};
