'use strict';

const sequelize = require('../config/sequelize');
const Organization = require('./organization/organization.model');
const { Country, City, Hub } = require('./locations/locations.model');
const { Role, Permission, RolePermission } = require('./auth/role.model');
const { User, UserRole, RefreshToken } = require('./auth/user.model');
const AuditLog = require('./audit/audit.model');
const { Customer, CustomerAddress, MerchantProfile } = require('./customers/customer.model');
const { ShippingService, PricingRule, CurrencyRate } = require('./pricing/pricing.model');
const {
  Shipment, ShipmentItem, ShipmentEvent,
  ShipmentAssignment, ShipmentCharge, DeliveryProof,
} = require('./shipments/shipment.model');
const { Invoice, Payment, PaymentAllocation, CODCollection } = require('./finance/finance.model');

// ─── Organization ─────────────────────────────────────────────────────────────
Organization.hasMany(Hub, { foreignKey: 'organizationId', as: 'hubs' });
Hub.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// ─── Locations ────────────────────────────────────────────────────────────────
Country.hasMany(City, { foreignKey: 'countryId', as: 'cities' });
City.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });

Country.hasMany(Hub, { foreignKey: 'countryId', as: 'hubs' });
Hub.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });

City.hasMany(Hub, { foreignKey: 'cityId', as: 'hubs' });
Hub.belongsTo(City, { foreignKey: 'cityId', as: 'city' });

// ─── Users ────────────────────────────────────────────────────────────────────
Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Hub.hasMany(User, { foreignKey: 'hubId', as: 'users' });
User.belongsTo(Hub, { foreignKey: 'hubId', as: 'hub' });

User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ─── Customers ────────────────────────────────────────────────────────────────
Organization.hasMany(Customer, { foreignKey: 'organizationId', as: 'customers' });
Customer.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Customer.hasMany(CustomerAddress, { foreignKey: 'customerId', as: 'addresses' });
CustomerAddress.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasOne(MerchantProfile, { foreignKey: 'customerId', as: 'merchantProfile' });
MerchantProfile.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// ─── Pricing ──────────────────────────────────────────────────────────────────
Organization.hasMany(ShippingService, { foreignKey: 'organizationId', as: 'services' });
ShippingService.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

ShippingService.hasMany(PricingRule, { foreignKey: 'serviceId', as: 'pricingRules' });
PricingRule.belongsTo(ShippingService, { foreignKey: 'serviceId', as: 'service' });

// ─── Shipments ────────────────────────────────────────────────────────────────
Organization.hasMany(Shipment, { foreignKey: 'organizationId', as: 'shipments' });
Shipment.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Customer.hasMany(Shipment, { foreignKey: 'senderCustomerId', as: 'shipments' });
Shipment.belongsTo(Customer, { foreignKey: 'senderCustomerId', as: 'sender' });

ShippingService.hasMany(Shipment, { foreignKey: 'serviceTypeId', as: 'shipments' });
Shipment.belongsTo(ShippingService, { foreignKey: 'serviceTypeId', as: 'service' });

Hub.hasMany(Shipment, { foreignKey: 'originHubId', as: 'originShipments' });
Shipment.belongsTo(Hub, { foreignKey: 'originHubId', as: 'originHub' });

Hub.hasMany(Shipment, { foreignKey: 'destinationHubId', as: 'destinationShipments' });
Shipment.belongsTo(Hub, { foreignKey: 'destinationHubId', as: 'destinationHub' });

Country.hasMany(Shipment, { foreignKey: 'originCountryId', as: 'originShipments' });
Shipment.belongsTo(Country, { foreignKey: 'originCountryId', as: 'originCountry' });

Country.hasMany(Shipment, { foreignKey: 'destinationCountryId', as: 'destinationShipments' });
Shipment.belongsTo(Country, { foreignKey: 'destinationCountryId', as: 'destinationCountry' });

Shipment.hasMany(ShipmentItem, { foreignKey: 'shipmentId', as: 'items' });
ShipmentItem.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

Shipment.hasMany(ShipmentEvent, { foreignKey: 'shipmentId', as: 'events' });
ShipmentEvent.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

User.hasMany(ShipmentEvent, { foreignKey: 'recordedBy', as: 'recordedEvents' });
ShipmentEvent.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

Shipment.hasMany(ShipmentAssignment, { foreignKey: 'shipmentId', as: 'assignments' });
ShipmentAssignment.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

User.hasMany(ShipmentAssignment, { foreignKey: 'driverId', as: 'deliveryAssignments' });
ShipmentAssignment.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

Shipment.hasMany(ShipmentCharge, { foreignKey: 'shipmentId', as: 'charges' });
ShipmentCharge.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

Shipment.hasOne(DeliveryProof, { foreignKey: 'shipmentId', as: 'deliveryProof' });
DeliveryProof.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

// ─── Finance ──────────────────────────────────────────────────────────────────
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Payment, { foreignKey: 'customerId', as: 'payments' });
Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Payment.hasMany(PaymentAllocation, { foreignKey: 'paymentId', as: 'allocations' });
PaymentAllocation.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

Invoice.hasMany(PaymentAllocation, { foreignKey: 'invoiceId', as: 'allocations' });
PaymentAllocation.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

Shipment.hasMany(CODCollection, { foreignKey: 'shipmentId', as: 'codCollections' });
CODCollection.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

User.hasMany(CODCollection, { foreignKey: 'driverId', as: 'codCollections' });
CODCollection.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

module.exports = {
  sequelize,
  Organization,
  Country, City, Hub,
  Role, Permission, RolePermission,
  User, UserRole, RefreshToken,
  AuditLog,
  Customer, CustomerAddress, MerchantProfile,
  ShippingService, PricingRule, CurrencyRate,
  Shipment, ShipmentItem, ShipmentEvent,
  ShipmentAssignment, ShipmentCharge, DeliveryProof,
  Invoice, Payment, PaymentAllocation, CODCollection,
};
