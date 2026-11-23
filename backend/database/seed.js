'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Organization, Country, City, Hub, Role, Permission, RolePermission, User, UserRole, ShippingService, CurrencyRate } = require('../modules/index');

const seed = async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log('🌱 Starting database seed...');

    // ─── Organization ────────────────────────────────────────────────────────
    const [org] = await Organization.findOrCreate({
      where: { name: 'Bublix Shipping' },
      defaults: {
        name: 'Bublix Shipping',
        nameAr: 'بوبليكس للشحن',
        email: 'info@bublixshipping.com',
        phone: '+256700000000',
        website: 'https://bublixshipping.com',
        defaultCurrency: 'USD',
        defaultTimezone: 'Africa/Kampala',
        trackingPrefix: 'BBLX',
      },
      transaction,
    });
    console.log('✅ Organization created');

    // ─── Countries ───────────────────────────────────────────────────────────
    const countries = await Country.bulkCreate([
      { name: 'Uganda', nameAr: 'أوغندا', code: 'UG', dialCode: '+256', currency: 'UGX' },
      { name: 'Sudan', nameAr: 'السودان', code: 'SD', dialCode: '+249', currency: 'SDG' },
      { name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', code: 'AE', dialCode: '+971', currency: 'AED' },
      { name: 'United States', nameAr: 'الولايات المتحدة', code: 'US', dialCode: '+1', currency: 'USD' },
      { name: 'Kenya', nameAr: 'كينيا', code: 'KE', dialCode: '+254', currency: 'KES' },
    ], { ignoreDuplicates: true, transaction });
    console.log('✅ Countries seeded');

    // ─── Cities ──────────────────────────────────────────────────────────────
    const ugandaCountry = await Country.findOne({ where: { code: 'UG' }, transaction });
    const cities = await City.bulkCreate([
      { countryId: ugandaCountry.id, name: 'Kampala', nameAr: 'كمبالا' },
      { countryId: ugandaCountry.id, name: 'Entebbe', nameAr: 'إنتيبي' },
      { countryId: ugandaCountry.id, name: 'Jinja', nameAr: 'جينجا' },
    ], { ignoreDuplicates: true, transaction });
    console.log('✅ Cities seeded');

    // ─── Hub (HQ Branch) ─────────────────────────────────────────────────────
    const kampalaCity = await City.findOne({ where: { name: 'Kampala' }, transaction });
    const [hqHub] = await Hub.findOrCreate({
      where: { code: 'BBLX-KLA' },
      defaults: {
        organizationId: org.id,
        countryId: ugandaCountry.id,
        cityId: kampalaCity.id,
        name: 'Kampala HQ Branch',
        nameAr: 'فرع كمبالا الرئيسي',
        code: 'BBLX-KLA',
        hubType: 'BRANCH',
        address: 'Kampala, Uganda',
        phone: '+256700000000',
        email: 'kampala@bublixshipping.com',
        timezone: 'Africa/Kampala',
        currency: 'UGX',
        isActive: true,
        isHeadquarters: true,
      },
      transaction,
    });
    console.log('✅ Headquarters hub created');

    // ─── Roles ───────────────────────────────────────────────────────────────
    const roleData = [
      { name: 'SUPER_ADMIN', description: 'Full system access' },
      { name: 'ADMIN', description: 'General administration' },
      { name: 'BRANCH_MANAGER', description: 'Branch management' },
      { name: 'STAFF', description: 'Shipping operations' },
      { name: 'ACCOUNTANT', description: 'Financial management' },
      { name: 'DRIVER', description: 'Delivery tasks' },
      { name: 'MERCHANT', description: 'Business customer' },
      { name: 'CUSTOMER', description: 'Individual customer' },
    ];
    await Role.bulkCreate(roleData, { ignoreDuplicates: true, transaction });
    console.log('✅ Roles seeded');

    // ─── Shipping Services ────────────────────────────────────────────────────
    await ShippingService.bulkCreate([
      {
        organizationId: org.id,
        name: 'Air Freight', nameAr: 'شحن جوي',
        code: 'AIR', serviceType: 'AIR', shipmentScope: 'INTERNATIONAL',
        volumetricDivisor: 6000, estimatedDaysMin: 3, estimatedDaysMax: 7,
      },
      {
        organizationId: org.id,
        name: 'Sea Freight', nameAr: 'شحن بحري',
        code: 'SEA', serviceType: 'SEA', shipmentScope: 'INTERNATIONAL',
        volumetricDivisor: 1000, estimatedDaysMin: 20, estimatedDaysMax: 45,
      },
      {
        organizationId: org.id,
        name: 'Express Delivery', nameAr: 'توصيل سريع',
        code: 'EXPRESS', serviceType: 'EXPRESS', shipmentScope: 'BOTH',
        volumetricDivisor: 5000, estimatedDaysMin: 1, estimatedDaysMax: 2,
      },
      {
        organizationId: org.id,
        name: 'Local Delivery', nameAr: 'توصيل محلي',
        code: 'LOCAL', serviceType: 'LOCAL', shipmentScope: 'DOMESTIC',
        volumetricDivisor: 5000, estimatedDaysMin: 1, estimatedDaysMax: 1,
      },
      {
        organizationId: org.id,
        name: 'Standard Land', nameAr: 'شحن بري',
        code: 'LAND', serviceType: 'LAND', shipmentScope: 'BOTH',
        volumetricDivisor: 5000, estimatedDaysMin: 5, estimatedDaysMax: 14,
      },
    ], { ignoreDuplicates: true, transaction });
    console.log('✅ Shipping services seeded');

    // ─── Currency Rates ───────────────────────────────────────────────────────
    await CurrencyRate.bulkCreate([
      { organizationId: org.id, fromCurrency: 'USD', toCurrency: 'UGX', rate: 3700.00, effectiveDate: new Date().toISOString().split('T')[0] },
      { organizationId: org.id, fromCurrency: 'USD', toCurrency: 'AED', rate: 3.67, effectiveDate: new Date().toISOString().split('T')[0] },
      { organizationId: org.id, fromCurrency: 'UGX', toCurrency: 'USD', rate: 0.000270, effectiveDate: new Date().toISOString().split('T')[0] },
    ], { ignoreDuplicates: true, transaction });
    console.log('✅ Currency rates seeded');

    // ─── Super Admin User ─────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Admin@123456', 12);

    const [superAdmin] = await User.findOrCreate({
      where: { email: 'admin@bublixshipping.com' },
      defaults: {
        organizationId: org.id,
        hubId: hqHub.id,
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@bublixshipping.com',
        phone: '+256700000000',
        passwordHash,
        isActive: true,
        isEmailVerified: true,
        language: 'en',
      },
      transaction,
    });

    // Assign SUPER_ADMIN role
    const superAdminRole = await Role.findOne({ where: { name: 'SUPER_ADMIN' }, transaction });
    await UserRole.findOrCreate({
      where: { userId: superAdmin.id, roleId: superAdminRole.id },
      transaction,
    });

    console.log('✅ Super admin user created');
    console.log('   Email   : admin@bublixshipping.com');
    console.log('   Password: Admin@123456');

    await transaction.commit();
    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
