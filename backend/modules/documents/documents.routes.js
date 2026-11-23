'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { Shipment, ShipmentItem, Country, Hub, ShippingService } = require('../index');

// Lazy-load pdf.service to avoid ERR_REQUIRE_ESM at startup
let _pdfService = null;
function getPdfService() {
  if (!_pdfService) _pdfService = require('./pdf.service');
  return _pdfService;
}

// ── Helper: load full shipment for documents ───────────────────────────────────
async function loadShipment(shipmentId, orgId) {
  return Shipment.findOne({
    where: { id: shipmentId, organizationId: orgId },
    include: [
      { model: ShipmentItem, as: 'items' },
      { model: Country, as: 'originCountry', attributes: ['name', 'code'] },
      { model: Country, as: 'destinationCountry', attributes: ['name', 'code'] },
      { model: Hub, as: 'originHub', attributes: ['name', 'code'] },
      { model: Hub, as: 'destinationHub', attributes: ['name', 'code'] },
      { model: ShippingService, as: 'service', attributes: ['name', 'serviceType'] },
    ],
  });
}

// ── Waybill ────────────────────────────────────────────────────────────────────
router.get('/waybill/:shipmentId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF'), async (req, res) => {
  try {
    const shipment = await loadShipment(req.params.shipmentId, req.user.organizationId);
    if (!shipment) return res.error('Shipment not found', 404);

    const { generateWaybill } = getPdfService();
    const pdfBuffer = await generateWaybill(shipment.toJSON(), req.user.hubId ? shipment.originHub?.name : 'Kampala HQ');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="waybill-${shipment.trackingNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Waybill error:', err);
    return res.error('Failed to generate waybill', 500);
  }
});

// ── Shipping Label ─────────────────────────────────────────────────────────────
router.get('/label/:shipmentId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF'), async (req, res) => {
  try {
    const shipment = await loadShipment(req.params.shipmentId, req.user.organizationId);
    if (!shipment) return res.error('Shipment not found', 404);

    const { generateShippingLabel } = getPdfService();
    const pdfBuffer = await generateShippingLabel(shipment.toJSON());

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="label-${shipment.trackingNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Label error:', err);
    return res.error('Failed to generate label', 500);
  }
});

module.exports = router;
