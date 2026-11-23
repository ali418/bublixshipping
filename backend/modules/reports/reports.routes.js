'use strict';

const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { Shipment, CODCollection, Invoice, Payment, User, Hub, sequelize } = require('../index');

// ─── Main Dashboard ────────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const hubFilter = req.userRoles.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r))
      ? {}
      : { [Op.or]: [{ originHubId: req.user.hubId }, { destinationHubId: req.user.hubId }] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayShipments,
      inTransit,
      delivered,
      pending,
      monthlyRevenue,
      pendingCOD,
    ] = await Promise.all([
      // Shipments created today
      Shipment.count({
        where: {
          organizationId: orgId,
          createdAt: { [Op.gte]: today },
          ...hubFilter,
        },
      }),
      // Currently in transit
      Shipment.count({
        where: {
          organizationId: orgId,
          shipmentStatus: { [Op.in]: ['PICKED_UP', 'AT_ORIGIN_HUB', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY'] },
          ...hubFilter,
        },
      }),
      // Delivered this month
      Shipment.count({
        where: {
          organizationId: orgId,
          shipmentStatus: 'DELIVERED',
          actualDeliveryDate: { [Op.gte]: monthStart },
          ...hubFilter,
        },
      }),
      // Pending payment
      Shipment.count({
        where: {
          organizationId: orgId,
          paymentStatus: 'PENDING',
          ...hubFilter,
        },
      }),
      // Revenue this month (sum of paid invoices)
      Payment.findAll({
        where: {
          organizationId: orgId,
          status: 'VERIFIED',
          paymentDate: { [Op.gte]: monthStart.toISOString().split('T')[0] },
        },
        attributes: [
          'currency',
          [fn('SUM', col('amount')), 'total'],
        ],
        group: ['currency'],
        raw: true,
      }),
      // Unsettled COD
      CODCollection.sum('collectedAmount', {
        where: { status: { [Op.in]: ['COLLECTED', 'SUBMITTED'] } },
      }),
    ]);

    // Status breakdown
    const statusBreakdown = await Shipment.findAll({
      where: { organizationId: orgId, ...hubFilter },
      attributes: [
        'shipmentStatus',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['shipmentStatus'],
      raw: true,
    });

    return res.success({
      today: {
        newShipments: todayShipments,
      },
      current: {
        inTransit,
        pendingPayment: pending,
      },
      monthly: {
        delivered,
        revenue: monthlyRevenue,
        pendingCOD: pendingCOD || 0,
      },
      statusBreakdown: statusBreakdown.reduce((acc, s) => {
        acc[s.shipmentStatus] = parseInt(s.count);
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error(err);
    return res.error('Failed to get dashboard data', 500);
  }
});

// ─── Shipment Reports ──────────────────────────────────────────────────────────
router.get('/shipments', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { startDate, endDate, hubId, shipmentType, groupBy } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };
    if (hubId) where[Op.or] = [{ originHubId: hubId }, { destinationHubId: hubId }];
    if (shipmentType) where.shipmentType = shipmentType;

    const [total, byStatus, byService] = await Promise.all([
      Shipment.count({ where }),
      Shipment.findAll({
        where,
        attributes: ['shipmentStatus', [fn('COUNT', col('id')), 'count']],
        group: ['shipmentStatus'],
        raw: true,
      }),
      Shipment.findAll({
        where,
        attributes: ['shipmentType', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('totalAmount')), 'revenue']],
        group: ['shipmentType'],
        raw: true,
      }),
    ]);

    return res.success({
      total,
      byStatus: byStatus.reduce((acc, s) => { acc[s.shipmentStatus] = parseInt(s.count); return acc; }, {}),
      byType: byService,
    });
  } catch (err) {
    return res.error('Failed to get shipment report', 500);
  }
});

// ─── Revenue Report ────────────────────────────────────────────────────────────
router.get('/revenue', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { startDate, endDate, currency } = req.query;

    const where = { organizationId: req.user.organizationId, status: 'VERIFIED' };
    if (startDate) where.paymentDate = { [Op.gte]: startDate };
    if (endDate) where.paymentDate = { ...where.paymentDate, [Op.lte]: endDate };
    if (currency) where.currency = currency.toUpperCase();

    const revenue = await Payment.findAll({
      where,
      attributes: [
        'currency',
        'paymentMethod',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'transactions'],
      ],
      group: ['currency', 'paymentMethod'],
      order: [['currency', 'ASC']],
      raw: true,
    });

    const codPending = await CODCollection.sum('collectedAmount', {
      where: { status: { [Op.in]: ['COLLECTED', 'SUBMITTED'] } },
    });

    return res.success({
      revenue,
      codPendingSettlement: codPending || 0,
    });
  } catch (err) {
    return res.error('Failed to get revenue report', 500);
  }
});

// ─── Branch Performance ────────────────────────────────────────────────────────
router.get('/branches', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };

    const branchStats = await Shipment.findAll({
      where,
      attributes: [
        'originHubId',
        [fn('COUNT', col('Shipment.id')), 'totalShipments'],
        [fn('SUM', col('totalAmount')), 'totalRevenue'],
        [fn('SUM', literal("CASE WHEN \"shipmentStatus\" = 'DELIVERED' THEN 1 ELSE 0 END")), 'delivered'],
      ],
      include: [{ model: Hub, as: 'originHub', attributes: ['name', 'code'] }],
      group: ['originHubId', 'originHub.id'],
      order: [[literal('"totalShipments"'), 'DESC']],
      raw: false,
    });

    return res.success({ branches: branchStats });
  } catch (err) {
    console.error(err);
    return res.error('Failed to get branch report', 500);
  }
});

// ─── Driver Performance ────────────────────────────────────────────────────────
router.get('/drivers', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };

    const driverStats = await CODCollection.findAll({
      where,
      attributes: [
        'driverId',
        [fn('COUNT', col('CODCollection.id')), 'deliveries'],
        [fn('SUM', col('collectedAmount')), 'totalCOD'],
      ],
      include: [{ model: User, as: 'driver', attributes: ['id', 'firstName', 'lastName'] }],
      group: ['driverId', 'driver.id'],
      order: [[literal('"deliveries"'), 'DESC']],
    });

    return res.success({ drivers: driverStats });
  } catch (err) {
    return res.error('Failed to get driver report', 500);
  }
});

module.exports = router;
