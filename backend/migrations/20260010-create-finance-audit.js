'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Invoices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      hubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      invoiceNumber: { type: Sequelize.STRING, allowNull: false, unique: true },
      customerId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Customers', key: 'id' } },
      invoiceType: { type: Sequelize.ENUM('SHIPMENT','COD_SETTLEMENT','STATEMENT','CREDIT_NOTE'), defaultValue: 'SHIPMENT' },
      status: { type: Sequelize.ENUM('DRAFT','ISSUED','PARTIAL','PAID','OVERDUE','CANCELLED','WRITTEN_OFF'), defaultValue: 'DRAFT' },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      taxAmount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      discountAmount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      paidAmount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      issueDate: { type: Sequelize.DATEONLY, allowNull: false },
      dueDate: { type: Sequelize.DATEONLY },
      notes: { type: Sequelize.TEXT },
      createdBy: { type: Sequelize.UUID },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('Invoices', ['customerId']);
    await queryInterface.addIndex('Invoices', ['status']);

    await queryInterface.createTable('Payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      hubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      customerId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Customers', key: 'id' } },
      referenceNumber: { type: Sequelize.STRING },
      paymentMethod: { type: Sequelize.ENUM('CASH','BANK_TRANSFER','MOBILE_MONEY','CREDIT'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      exchangeRate: { type: Sequelize.DECIMAL(16, 6), defaultValue: 1 },
      baseAmount: { type: Sequelize.DECIMAL(12, 2) },
      baseCurrency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      paymentDate: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('PENDING','VERIFIED','REJECTED','REVERSED'), defaultValue: 'PENDING' },
      proofUrl: { type: Sequelize.STRING },
      notes: { type: Sequelize.TEXT },
      recordedBy: { type: Sequelize.UUID },
      verifiedBy: { type: Sequelize.UUID },
      verifiedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('PaymentAllocations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      paymentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Payments', key: 'id' }, onDelete: 'CASCADE' },
      invoiceId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Invoices', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('CODCollections', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      shipmentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Shipments', key: 'id' } },
      driverId: { type: Sequelize.UUID, references: { model: 'Users', key: 'id' } },
      hubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      collectedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      collectedAt: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.ENUM('COLLECTED','SUBMITTED','SETTLED','DISPUTED'), defaultValue: 'COLLECTED' },
      settledAt: { type: Sequelize.DATE },
      settledBy: { type: Sequelize.UUID },
      notes: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('CODCollections', ['shipmentId']);
    await queryInterface.addIndex('CODCollections', ['driverId']);

    await queryInterface.createTable('AuditLogs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      userId: { type: Sequelize.UUID },
      organizationId: { type: Sequelize.UUID },
      hubId: { type: Sequelize.UUID },
      action: { type: Sequelize.STRING, allowNull: false },
      resource: { type: Sequelize.STRING, allowNull: false },
      resourceId: { type: Sequelize.STRING },
      oldValues: { type: Sequelize.JSONB },
      newValues: { type: Sequelize.JSONB },
      ipAddress: { type: Sequelize.STRING(45) },
      userAgent: { type: Sequelize.TEXT },
      notes: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('AuditLogs', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['resource', 'resourceId']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('AuditLogs');
    await queryInterface.dropTable('CODCollections');
    await queryInterface.dropTable('PaymentAllocations');
    await queryInterface.dropTable('Payments');
    await queryInterface.dropTable('Invoices');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Invoices_invoiceType";
      DROP TYPE IF EXISTS "enum_Invoices_status";
      DROP TYPE IF EXISTS "enum_Payments_paymentMethod";
      DROP TYPE IF EXISTS "enum_Payments_status";
      DROP TYPE IF EXISTS "enum_CODCollections_status";
    `);
  },
};
