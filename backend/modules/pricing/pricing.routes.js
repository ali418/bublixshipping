'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const { ShippingService, PricingRule, CurrencyRate, Country, Hub } = require('../index');
const { calculateChargeableWeight } = require('../shipments/shipment.service');

// ─── Shipping Services ─────────────────────────────────────────────────────────
router.get('/services', authenticate, async (req, res) => {
  try {
    const { scope } = req.query;
    const where = { organizationId: req.user.organizationId, isActive: true };
    if (scope) where[Op.or] = [{ shipmentScope: scope }, { shipmentScope: 'BOTH' }];

    const services = await ShippingService.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
    return res.success({ services });
  } catch (err) {
    return res.error('Failed to get services', 500);
  }
});

router.post('/services', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name, nameAr, code, serviceType, shipmentScope, volumetricDivisor, estimatedDaysMin, estimatedDaysMax, sortOrder } = req.body;

    if (!name || !code || !serviceType) return res.error('name, code and serviceType are required', 400);

    const existing = await ShippingService.findOne({ where: { code: code.toUpperCase() } });
    if (existing) return res.error('Service code already exists', 409);

    const service = await ShippingService.create({
      organizationId: req.user.organizationId,
      name, nameAr: nameAr || null,
      code: code.toUpperCase(),
      serviceType, shipmentScope: shipmentScope || 'BOTH',
      volumetricDivisor: volumetricDivisor || 5000,
      estimatedDaysMin: estimatedDaysMin || null,
      estimatedDaysMax: estimatedDaysMax || null,
      sortOrder: sortOrder || 0,
      isActive: true,
    });

    return res.success({ service }, 'Service created', 201);
  } catch (err) {
    return res.error(err.message || 'Failed to create service', 500);
  }
});

// ─── Pricing Rules ─────────────────────────────────────────────────────────────
router.get('/rules', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { serviceId } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (serviceId) where.serviceId = serviceId;

    const { count, rows } = await PricingRule.findAndCountAll({
      where,
      limit,
      offset,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
      include: [
        { model: ShippingService, as: 'service', attributes: ['name', 'code', 'serviceType'] },
        { model: Country, as: 'originCountry', attributes: ['name', 'code'], required: false },
        { model: Country, as: 'destinationCountry', attributes: ['name', 'code'], required: false },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    return res.error('Failed to get pricing rules', 500);
  }
});

router.post('/rules', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name, serviceId, originCountryId, destinationCountryId, originHubId, destinationHubId, pricingMethod, baseRate, minimumCharge, currency, weightBreaks, validFrom, validTo, priority } = req.body;

    if (!name || !serviceId || !pricingMethod || baseRate === undefined) {
      return res.error('name, serviceId, pricingMethod and baseRate are required', 400);
    }

    const rule = await PricingRule.create({
      organizationId: req.user.organizationId,
      name, serviceId,
      originCountryId: originCountryId || null,
      destinationCountryId: destinationCountryId || null,
      originHubId: originHubId || null,
      destinationHubId: destinationHubId || null,
      pricingMethod, baseRate,
      minimumCharge: minimumCharge || 0,
      currency: currency || 'USD',
      weightBreaks: weightBreaks || [],
      validFrom: validFrom || null,
      validTo: validTo || null,
      priority: priority || 0,
      isActive: true,
    });

    return res.success({ rule }, 'Pricing rule created', 201);
  } catch (err) {
    return res.error(err.message || 'Failed to create pricing rule', 500);
  }
});

router.patch('/rules/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const rule = await PricingRule.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!rule) return res.error('Pricing rule not found', 404);

    const updatable = ['name', 'baseRate', 'minimumCharge', 'currency', 'weightBreaks', 'validFrom', 'validTo', 'priority', 'isActive'];
    const updates = {};
    for (const key of updatable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await rule.update(updates);
    return res.success(null, 'Pricing rule updated');
  } catch (err) {
    return res.error('Failed to update pricing rule', 500);
  }
});

// ─── Shipping Quote ────────────────────────────────────────────────────────────
router.post('/quote', async (req, res) => {
  try {
    const { serviceId, originCountryId, destinationCountryId, actualWeight, length, width, height, organizationId } = req.body;

    if (!serviceId || !actualWeight) {
      return res.error('serviceId and actualWeight are required', 400);
    }

    const service = await ShippingService.findByPk(serviceId);
    if (!service) return res.error('Service not found', 404);

    const dimensions = (length && width && height) ? { length, width, height } : null;
    const { volumetricWeight, chargeableWeight } = calculateChargeableWeight(
      parseFloat(actualWeight),
      dimensions,
      parseFloat(service.volumetricDivisor)
    );

    // Find best matching pricing rule (highest priority)
    const ruleWhere = {
      serviceId,
      isActive: true,
      [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: new Date() } }],
    };
    if (originCountryId) ruleWhere[Op.and] = [
      { [Op.or]: [{ originCountryId }, { originCountryId: null }] },
      { [Op.or]: [{ destinationCountryId: destinationCountryId || null }, { destinationCountryId: null }] },
    ];

    const rule = await PricingRule.findOne({
      where: ruleWhere,
      order: [['priority', 'DESC']],
    });

    if (!rule) {
      return res.error('No pricing rule found for this route and service', 404);
    }

    let shippingCost = 0;

    if (rule.pricingMethod === 'PER_KG') {
      // Check weight breaks
      let rate = parseFloat(rule.baseRate);
      if (rule.weightBreaks && rule.weightBreaks.length > 0) {
        for (const wb of rule.weightBreaks) {
          if (chargeableWeight <= wb.upTo) {
            rate = wb.rate;
            break;
          }
        }
      }
      shippingCost = chargeableWeight * rate;
    } else if (rule.pricingMethod === 'FLAT_RATE') {
      shippingCost = parseFloat(rule.baseRate);
    } else if (rule.pricingMethod === 'PER_CBM') {
      const cbm = dimensions ? (dimensions.length * dimensions.width * dimensions.height) / 1000000 : 0;
      shippingCost = cbm * parseFloat(rule.baseRate);
    }

    shippingCost = Math.max(shippingCost, parseFloat(rule.minimumCharge));

    return res.success({
      service: { id: service.id, name: service.name, code: service.code },
      weight: {
        actual: parseFloat(actualWeight),
        volumetric: volumetricWeight ? parseFloat(volumetricWeight.toFixed(3)) : null,
        chargeable: parseFloat(chargeableWeight.toFixed(3)),
      },
      pricing: {
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        currency: rule.currency,
        pricingMethod: rule.pricingMethod,
        estimatedDays: service.estimatedDaysMin
          ? `${service.estimatedDaysMin}-${service.estimatedDaysMax} days`
          : null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.error('Quote calculation failed', 500);
  }
});

// ─── Currency Rates ────────────────────────────────────────────────────────────
router.get('/currencies', authenticate, async (req, res) => {
  try {
    const rates = await CurrencyRate.findAll({
      where: { organizationId: req.user.organizationId, isActive: true },
      order: [['effectiveDate', 'DESC']],
    });
    return res.success({ rates });
  } catch (err) {
    return res.error('Failed to get currency rates', 500);
  }
});

router.post('/currencies', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { fromCurrency, toCurrency, rate, effectiveDate } = req.body;
    if (!fromCurrency || !toCurrency || !rate) return res.error('fromCurrency, toCurrency and rate are required', 400);

    const currencyRate = await CurrencyRate.create({
      organizationId: req.user.organizationId,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate: parseFloat(rate),
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      setBy: req.user.id,
      isActive: true,
    });

    return res.success({ currencyRate }, 'Currency rate added', 201);
  } catch (err) {
    return res.error('Failed to add currency rate', 500);
  }
});

module.exports = router;
