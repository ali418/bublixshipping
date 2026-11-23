'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const { Hub, Country, City, User, Shipment, AuditLog } = require('../index');

// ─── List Hubs ─────────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, countryId, hubType } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (countryId) where.countryId = countryId;
    if (hubType) where.hubType = hubType;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Hub.findAndCountAll({
      where,
      limit,
      offset,
      order: [['isHeadquarters', 'DESC'], ['name', 'ASC']],
      include: [
        { model: Country, as: 'country', attributes: ['name', 'code'] },
        { model: City, as: 'city', attributes: ['name'] },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error(err);
    return res.error('Failed to list hubs', 500);
  }
});

// ─── Create Hub ────────────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name, nameAr, code, hubType, countryId, cityId, address, phone, email, timezone, currency } = req.body;

    if (!name || !code || !countryId) return res.error('name, code and countryId are required', 400);

    const existing = await Hub.findOne({ where: { code: code.toUpperCase() } });
    if (existing) return res.error('Hub code already exists', 409);

    const hub = await Hub.create({
      organizationId: req.user.organizationId,
      name, nameAr: nameAr || null,
      code: code.toUpperCase(),
      hubType: hubType || 'BRANCH',
      countryId, cityId: cityId || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      timezone: timezone || 'Africa/Kampala',
      currency: currency || 'USD',
      isActive: true,
    });

    return res.success({ hub }, 'Hub created successfully', 201);
  } catch (err) {
    console.error(err);
    return res.error(err.message || 'Failed to create hub', 500);
  }
});

// ─── Get Hub ───────────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const hub = await Hub.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [
        { model: Country, as: 'country' },
        { model: City, as: 'city' },
        { model: User, as: 'users', attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'] },
      ],
    });
    if (!hub) return res.error('Hub not found', 404);
    return res.success({ hub });
  } catch (err) {
    return res.error('Failed to get hub', 500);
  }
});

// ─── Update Hub ────────────────────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const hub = await Hub.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!hub) return res.error('Hub not found', 404);

    const { name, nameAr, address, phone, email, timezone, currency, isActive } = req.body;
    await hub.update({
      name: name || hub.name,
      nameAr: nameAr !== undefined ? nameAr : hub.nameAr,
      address: address !== undefined ? address : hub.address,
      phone: phone !== undefined ? phone : hub.phone,
      email: email !== undefined ? email : hub.email,
      timezone: timezone || hub.timezone,
      currency: currency || hub.currency,
      isActive: isActive !== undefined ? isActive : hub.isActive,
    });

    return res.success(null, 'Hub updated successfully');
  } catch (err) {
    return res.error('Failed to update hub', 500);
  }
});

// ─── Hub Shipments ─────────────────────────────────────────────────────────────
router.get('/:id/shipments', authenticate, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    const where = {
      organizationId: req.user.organizationId,
      [Op.or]: [{ originHubId: req.params.id }, { destinationHubId: req.params.id }],
    };
    if (status) where.shipmentStatus = status;

    const { count, rows } = await Shipment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'trackingNumber', 'shipmentStatus', 'shipmentType', 'receiverName', 'totalAmount', 'currency', 'createdAt'],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    return res.error('Failed to get hub shipments', 500);
  }
});

module.exports = router;
