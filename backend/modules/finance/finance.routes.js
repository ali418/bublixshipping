'use strict';

const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const { Invoice, Payment, PaymentAllocation, CODCollection, Customer, Hub, Shipment, AuditLog, sequelize } = require('../index');

// ─── INVOICES ──────────────────────────────────────────────────────────────────
router.get('/invoices', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, customerId, startDate, endDate } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate) where.issueDate = { [Op.gte]: startDate };
    if (endDate) where.issueDate = { ...where.issueDate, [Op.lte]: endDate };

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      limit,
      offset,
      order: [['issueDate', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'companyName', 'phone'] },
        { model: Hub, as: 'hub', attributes: ['id', 'name', 'code'], required: false },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error(err);
    return res.error('Failed to list invoices', 500);
  }
});

router.get('/invoices/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [
        { model: Customer, as: 'customer' },
        { model: PaymentAllocation, as: 'allocations', include: [{ model: Payment, as: 'payment' }] },
      ],
    });
    if (!invoice) return res.error('Invoice not found', 404);
    return res.success({ invoice });
  } catch (err) {
    return res.error('Failed to get invoice', 500);
  }
});

router.post('/invoices', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { customerId, hubId, invoiceType, subtotal, taxAmount, discountAmount, currency, issueDate, dueDate, notes } = req.body;

    if (!customerId || subtotal === undefined) return res.error('customerId and subtotal are required', 400);

    const customer = await Customer.findOne({ where: { id: customerId, organizationId: req.user.organizationId } });
    if (!customer) return res.error('Customer not found', 404);

    const totalAmount = parseFloat(subtotal) + parseFloat(taxAmount || 0) - parseFloat(discountAmount || 0);

    // Generate invoice number: INV-YYYYMM-XXXXX
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await Invoice.count({ where: { organizationId: req.user.organizationId } });
    const invoiceNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;

    const invoice = await Invoice.create({
      organizationId: req.user.organizationId,
      hubId: hubId || req.user.hubId,
      invoiceNumber,
      customerId,
      invoiceType: invoiceType || 'SHIPMENT',
      status: 'ISSUED',
      subtotal: parseFloat(subtotal),
      taxAmount: parseFloat(taxAmount || 0),
      discountAmount: parseFloat(discountAmount || 0),
      totalAmount,
      paidAmount: 0,
      currency: currency || 'USD',
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || null,
      notes: notes || null,
      createdBy: req.user.id,
    });

    return res.success({ invoice }, 'Invoice created', 201);
  } catch (err) {
    console.error(err);
    return res.error(err.message || 'Failed to create invoice', 500);
  }
});

// ─── PAYMENTS ──────────────────────────────────────────────────────────────────
router.get('/payments', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, customerId, startDate, endDate } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate) where.paymentDate = { [Op.gte]: startDate };
    if (endDate) where.paymentDate = { ...where.paymentDate, [Op.lte]: endDate };

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['paymentDate', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'companyName'] },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    return res.error('Failed to list payments', 500);
  }
});

router.post('/payments', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'BRANCH_MANAGER', 'STAFF'), async (req, res) => {
  try {
    const { customerId, referenceNumber, paymentMethod, amount, currency, exchangeRate, paymentDate, invoiceId, notes } = req.body;

    if (!customerId || !paymentMethod || !amount) {
      return res.error('customerId, paymentMethod and amount are required', 400);
    }

    const transaction = await sequelize.transaction();
    try {
      const payment = await Payment.create({
        organizationId: req.user.organizationId,
        hubId: req.user.hubId,
        customerId,
        referenceNumber: referenceNumber || null,
        paymentMethod,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        exchangeRate: parseFloat(exchangeRate || 1),
        baseAmount: parseFloat(amount) * parseFloat(exchangeRate || 1),
        baseCurrency: 'USD',
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        status: ['CASH'].includes(paymentMethod) ? 'VERIFIED' : 'PENDING',
        notes: notes || null,
        recordedBy: req.user.id,
      }, { transaction });

      // Auto-allocate to invoice if provided
      if (invoiceId) {
        const invoice = await Invoice.findByPk(invoiceId, { transaction });
        if (invoice) {
          const allocateAmount = Math.min(parseFloat(amount), parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount));
          if (allocateAmount > 0) {
            await PaymentAllocation.create({
              paymentId: payment.id,
              invoiceId,
              amount: allocateAmount,
              currency: currency || 'USD',
            }, { transaction });

            const newPaid = parseFloat(invoice.paidAmount) + allocateAmount;
            const newStatus = newPaid >= parseFloat(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
            await invoice.update({ paidAmount: newPaid, status: newStatus }, { transaction });
          }
        }
      }

      await transaction.commit();
      return res.success({ payment }, 'Payment recorded', 201);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    return res.error(err.message || 'Failed to record payment', 500);
  }
});

router.post('/payments/:id/verify', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { status, notes } = req.body; // status: VERIFIED or REJECTED
    const payment = await Payment.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!payment) return res.error('Payment not found', 404);
    if (payment.status === 'VERIFIED') return res.error('Payment already verified', 400);

    await payment.update({
      status: status || 'VERIFIED',
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      notes: notes || payment.notes,
    });

    await AuditLog.create({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: `PAYMENT_${status || 'VERIFIED'}`,
      resource: 'Payment',
      resourceId: payment.id,
      ipAddress: req.ip,
    });

    return res.success(null, `Payment ${status || 'verified'} successfully`);
  } catch (err) {
    return res.error('Failed to verify payment', 500);
  }
});

// ─── COD COLLECTIONS ───────────────────────────────────────────────────────────
router.get('/cod', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, driverId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (!req.userRoles.includes('SUPER_ADMIN') && !req.userRoles.includes('ADMIN')) {
      where.hubId = req.user.hubId;
    }

    const { count, rows } = await CODCollection.findAndCountAll({
      where,
      limit,
      offset,
      order: [['collectedAt', 'DESC']],
      include: [
        { model: Shipment, as: 'shipment', attributes: ['trackingNumber', 'receiverName'] },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    return res.error('Failed to list COD collections', 500);
  }
});

router.post('/cod', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF', 'DRIVER'), async (req, res) => {
  try {
    const { shipmentId, collectedAmount, currency, notes } = req.body;
    if (!shipmentId || !collectedAmount) return res.error('shipmentId and collectedAmount are required', 400);

    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) return res.error('Shipment not found', 404);

    const existing = await CODCollection.findOne({ where: { shipmentId } });
    if (existing) return res.error('COD already recorded for this shipment', 409);

    const cod = await CODCollection.create({
      shipmentId,
      driverId: req.user.id,
      hubId: req.user.hubId,
      collectedAmount: parseFloat(collectedAmount),
      currency: currency || shipment.codCurrency || 'USD',
      collectedAt: new Date(),
      status: 'COLLECTED',
      notes: notes || null,
    });

    return res.success({ cod }, 'COD collection recorded', 201);
  } catch (err) {
    return res.error(err.message || 'Failed to record COD', 500);
  }
});

router.post('/cod/:id/settle', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const cod = await CODCollection.findByPk(req.params.id);
    if (!cod) return res.error('COD record not found', 404);
    if (cod.status === 'SETTLED') return res.error('Already settled', 400);

    await cod.update({
      status: 'SETTLED',
      settledAt: new Date(),
      settledBy: req.user.id,
    });

    return res.success(null, 'COD settled successfully');
  } catch (err) {
    return res.error('Failed to settle COD', 500);
  }
});

module.exports = router;
