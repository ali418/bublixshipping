'use strict';
const SHIPMENT_STATUSES = ['CREATED','PICKED_UP','AT_ORIGIN_HUB','IN_TRANSIT','AT_DESTINATION_HUB','CUSTOMS_CLEARANCE','OUT_FOR_DELIVERY','DELIVERED','ON_HOLD','DELIVERY_FAILED','RETURNED','CANCELLED'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Shipments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      organizationId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Organizations', key: 'id' } },
      trackingNumber: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      shipmentType: { type: Sequelize.ENUM('DOMESTIC','INTERNATIONAL'), allowNull: false },
      serviceTypeId: { type: Sequelize.UUID, allowNull: false, references: { model: 'ShippingServices', key: 'id' } },
      senderCustomerId: { type: Sequelize.UUID, references: { model: 'Customers', key: 'id' } },
      senderNameSnapshot: { type: Sequelize.STRING, allowNull: false },
      senderPhoneSnapshot: { type: Sequelize.STRING, allowNull: false },
      senderAddressSnapshot: { type: Sequelize.JSONB },
      receiverName: { type: Sequelize.STRING, allowNull: false },
      receiverPhone: { type: Sequelize.STRING, allowNull: false },
      receiverEmail: { type: Sequelize.STRING },
      receiverAddress: { type: Sequelize.JSONB },
      originCountryId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Countries', key: 'id' } },
      destinationCountryId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Countries', key: 'id' } },
      originHubId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Hubs', key: 'id' } },
      destinationHubId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Hubs', key: 'id' } },
      currentHubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      actualWeight: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      volumetricWeight: { type: Sequelize.DECIMAL(10, 3) },
      chargeableWeight: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      totalPieces: { type: Sequelize.INTEGER, defaultValue: 1 },
      declaredValue: { type: Sequelize.DECIMAL(12, 2) },
      declaredCurrency: { type: Sequelize.CHAR(3) },
      dimensions: { type: Sequelize.JSONB },
      shippingCost: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      additionalCharges: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      discountAmount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      paymentMethod: { type: Sequelize.ENUM('CASH','COD','BANK_TRANSFER','MOBILE_MONEY','CREDIT'), allowNull: false },
      paymentStatus: { type: Sequelize.ENUM('PENDING','PARTIAL','PAID','OVERDUE','WAIVED'), defaultValue: 'PENDING' },
      codAmount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      codCurrency: { type: Sequelize.CHAR(3) },
      shipmentStatus: { type: Sequelize.ENUM(...SHIPMENT_STATUSES), defaultValue: 'CREATED' },
      estimatedDeliveryDate: { type: Sequelize.DATEONLY },
      actualDeliveryDate: { type: Sequelize.DATE },
      specialInstructions: { type: Sequelize.TEXT },
      customsStatus: { type: Sequelize.STRING },
      customsReference: { type: Sequelize.STRING },
      customsValue: { type: Sequelize.DECIMAL(12, 2) },
      customsCurrency: { type: Sequelize.CHAR(3) },
      customsClearanceNotes: { type: Sequelize.TEXT },
      incoterm: { type: Sequelize.STRING(10) },
      createdBy: { type: Sequelize.UUID },
      cancelledAt: { type: Sequelize.DATE },
      cancelledBy: { type: Sequelize.UUID },
      cancellationReason: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('Shipments', ['trackingNumber'], { unique: true });
    await queryInterface.addIndex('Shipments', ['shipmentStatus']);
    await queryInterface.addIndex('Shipments', ['originHubId']);
    await queryInterface.addIndex('Shipments', ['destinationHubId']);
    await queryInterface.addIndex('Shipments', ['senderCustomerId']);
    await queryInterface.addIndex('Shipments', ['createdAt']);
    await queryInterface.addIndex('Shipments', ['organizationId']);

    await queryInterface.createTable('ShipmentItems', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      shipmentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Shipments', key: 'id' }, onDelete: 'CASCADE' },
      description: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
      weight: { type: Sequelize.DECIMAL(10, 3) },
      length: { type: Sequelize.DECIMAL(10, 2) },
      width: { type: Sequelize.DECIMAL(10, 2) },
      height: { type: Sequelize.DECIMAL(10, 2) },
      unitValue: { type: Sequelize.DECIMAL(12, 2) },
      currency: { type: Sequelize.CHAR(3) },
      hsCode: { type: Sequelize.STRING(20) },
      barcode: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('ShipmentEvents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      shipmentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Shipments', key: 'id' }, onDelete: 'CASCADE' },
      status: { type: Sequelize.ENUM(...SHIPMENT_STATUSES), allowNull: false },
      hubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      location: { type: Sequelize.STRING },
      notes: { type: Sequelize.TEXT },
      isPublic: { type: Sequelize.BOOLEAN, defaultValue: true },
      recordedBy: { type: Sequelize.UUID, references: { model: 'Users', key: 'id' } },
      eventTime: { type: Sequelize.DATE, allowNull: false },
      metadata: { type: Sequelize.JSONB },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('ShipmentEvents', ['shipmentId']);

    await queryInterface.createTable('ShipmentAssignments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      shipmentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Shipments', key: 'id' } },
      driverId: { type: Sequelize.UUID, references: { model: 'Users', key: 'id' } },
      hubId: { type: Sequelize.UUID, references: { model: 'Hubs', key: 'id' } },
      assignmentType: { type: Sequelize.ENUM('PICKUP','DELIVERY','TRANSFER'), allowNull: false },
      status: { type: Sequelize.ENUM('PENDING','ACCEPTED','IN_PROGRESS','COMPLETED','FAILED','CANCELLED'), defaultValue: 'PENDING' },
      assignedBy: { type: Sequelize.UUID },
      scheduledDate: { type: Sequelize.DATEONLY },
      completedAt: { type: Sequelize.DATE },
      notes: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('ShipmentCharges', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      shipmentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Shipments', key: 'id' }, onDelete: 'CASCADE' },
      chargeType: { type: Sequelize.ENUM('SHIPPING','CUSTOMS','HANDLING','INSURANCE','COD_FEE','FUEL_SURCHARGE','REMOTE_AREA','OVERSIZE','OTHER'), allowNull: false },
      description: { type: Sequelize.STRING },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
      isIncludedInTotal: { type: Sequelize.BOOLEAN, defaultValue: true },
      addedBy: { type: Sequelize.UUID },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('DeliveryProofs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      shipmentId: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'Shipments', key: 'id' } },
      driverId: { type: Sequelize.UUID, references: { model: 'Users', key: 'id' } },
      recipientName: { type: Sequelize.STRING, allowNull: false },
      recipientRelation: { type: Sequelize.STRING },
      signatureUrl: { type: Sequelize.STRING },
      photoUrl: { type: Sequelize.STRING },
      deliveredAt: { type: Sequelize.DATE, allowNull: false },
      notes: { type: Sequelize.TEXT },
      gpsCoordinates: { type: Sequelize.JSONB },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('DeliveryProofs');
    await queryInterface.dropTable('ShipmentCharges');
    await queryInterface.dropTable('ShipmentAssignments');
    await queryInterface.dropTable('ShipmentEvents');
    await queryInterface.dropTable('ShipmentItems');
    await queryInterface.dropTable('Shipments');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Shipments_shipmentType";
      DROP TYPE IF EXISTS "enum_Shipments_paymentMethod";
      DROP TYPE IF EXISTS "enum_Shipments_paymentStatus";
      DROP TYPE IF EXISTS "enum_Shipments_shipmentStatus";
      DROP TYPE IF EXISTS "enum_ShipmentEvents_status";
      DROP TYPE IF EXISTS "enum_ShipmentAssignments_assignmentType";
      DROP TYPE IF EXISTS "enum_ShipmentAssignments_status";
      DROP TYPE IF EXISTS "enum_ShipmentCharges_chargeType";
    `);
  },
};
