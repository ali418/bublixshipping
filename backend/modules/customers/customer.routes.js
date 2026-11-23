'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const { Customer, CustomerAddress, MerchantProfile, Country, City, AuditLog } = require('../index');

// ─── List Customers ────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, isMerchant, status } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (isMerchant !== undefined) where.isMerchant = isMerchant === 'true';
    if (status !== undefined) where.isActive = status === 'active';
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Country, as: 'country', attributes: ['name', 'code'], required: false },
        { model: MerchantProfile, as: 'merchantProfile', required: false },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error(err);
    return res.error('Failed to list customers', 500);
  }
});

// ─── Create Customer ───────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF'), async (req, res) => {
  try {
    const { firstName, lastName, companyName, email, phone, phone2, countryId, cityId, address, customerType, taxNumber, notes } = req.body;

    if (!firstName || !phone) return res.error('firstName and phone are required', 400);

    const customer = await Customer.create({
      organizationId: req.user.organizationId,
      customerType: customerType || 'INDIVIDUAL',
      firstName, lastName: lastName || '',
      companyName: companyName || null,
      email: email ? email.toLowerCase() : null,
      phone, phone2: phone2 || null,
      countryId: countryId || null,
      cityId: cityId || null,
      address: address || null,
      taxNumber: taxNumber || null,
      notes: notes || null,
      isActive: true,
      createdBy: req.user.id,
    });

    return res.success({ customer }, 'Customer created successfully', 201);
  } catch (err) {
    console.error(err);
    return res.error(err.message || 'Failed to create customer', 500);
  }
});

// ─── Get Customer ──────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [
        { model: Country, as: 'country', attributes: ['name', 'code'], required: false },
        { model: City, as: 'city', attributes: ['name'], required: false },
        { model: CustomerAddress, as: 'addresses', required: false },
        { model: MerchantProfile, as: 'merchantProfile', required: false },
      ],
    });
    if (!customer) return res.error('Customer not found', 404);
    return res.success({ customer });
  } catch (err) {
    return res.error('Failed to get customer', 500);
  }
});

// ─── Update Customer ───────────────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!customer) return res.error('Customer not found', 404);

    const updatable = ['firstName', 'lastName', 'companyName', 'email', 'phone', 'phone2', 'countryId', 'cityId', 'address', 'taxNumber', 'notes', 'isActive'];
    const updates = {};
    for (const key of updatable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await customer.update(updates);
    return res.success(null, 'Customer updated successfully');
  } catch (err) {
    return res.error('Failed to update customer', 500);
  }
});

// ─── Add Customer Address ──────────────────────────────────────────────────────
router.post('/:id/addresses', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!customer) return res.error('Customer not found', 404);

    const { label, countryId, cityId, addressLine1, addressLine2, postalCode, isDefault } = req.body;
    if (!addressLine1) return res.error('addressLine1 is required', 400);

    if (isDefault) {
      await CustomerAddress.update({ isDefault: false }, { where: { customerId: customer.id } });
    }

    const address = await CustomerAddress.create({
      customerId: customer.id,
      label: label || 'Home',
      countryId: countryId || null,
      cityId: cityId || null,
      addressLine1,
      addressLine2: addressLine2 || null,
      postalCode: postalCode || null,
      isDefault: isDefault || false,
    });

    return res.success({ address }, 'Address added', 201);
  } catch (err) {
    return res.error('Failed to add address', 500);
  }
});

// ─── Merchants ─────────────────────────────────────────────────────────────────
router.get('/merchants/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const { count, rows } = await Customer.findAndCountAll({
      where: { organizationId: req.user.organizationId, isMerchant: true },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: MerchantProfile, as: 'merchantProfile', required: true }],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    return res.error('Failed to list merchants', 500);
  }
});

// ─── Create Merchant Profile ───────────────────────────────────────────────────
router.post('/:id/merchant', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!customer) return res.error('Customer not found', 404);

    const existing = await MerchantProfile.findOne({ where: { customerId: customer.id } });
    if (existing) return res.error('Merchant profile already exists', 409);

    const { businessName, businessType, contractNumber, discountPercentage, creditLimit, paymentTermDays } = req.body;
    if (!businessName) return res.error('businessName is required', 400);

    const profile = await MerchantProfile.create({
      customerId: customer.id,
      businessName, businessType: businessType || null,
      contractNumber: contractNumber || null,
      discountPercentage: discountPercentage || 0,
      creditLimit: creditLimit || 0,
      paymentTermDays: paymentTermDays || 0,
      isApproved: false,
    });

    await customer.update({ isMerchant: true });

    return res.success({ profile }, 'Merchant profile created', 201);
  } catch (err) {
    return res.error('Failed to create merchant profile', 500);
  }
});

module.exports = router;
