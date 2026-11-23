'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const { Country, City } = require('../index');
const { Op } = require('sequelize');

// ─── Countries ─────────────────────────────────────────────────────────────────
router.get('/countries', async (req, res) => {
  try {
    const countries = await Country.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'nameAr', 'code', 'dialCode', 'currency'],
    });
    return res.success({ countries });
  } catch (err) {
    return res.error('Failed to get countries', 500);
  }
});

router.post('/countries', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name, nameAr, code, dialCode, currency } = req.body;
    if (!name || !code) return res.error('name and code are required', 400);

    const country = await Country.create({
      name, nameAr: nameAr || null,
      code: code.toUpperCase(),
      dialCode: dialCode || null,
      currency: currency || null,
      isActive: true,
    });

    return res.success({ country }, 'Country added', 201);
  } catch (err) {
    return res.error(err.message || 'Failed to add country', 500);
  }
});

// ─── Cities ────────────────────────────────────────────────────────────────────
router.get('/countries/:countryId/cities', async (req, res) => {
  try {
    const cities = await City.findAll({
      where: { countryId: req.params.countryId, isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'nameAr'],
    });
    return res.success({ cities });
  } catch (err) {
    return res.error('Failed to get cities', 500);
  }
});

router.post('/cities', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name, nameAr, countryId } = req.body;
    if (!name || !countryId) return res.error('name and countryId are required', 400);

    const city = await City.create({ name, nameAr: nameAr || null, countryId, isActive: true });
    return res.success({ city }, 'City added', 201);
  } catch (err) {
    return res.error(err.message || 'Failed to add city', 500);
  }
});

module.exports = router;
