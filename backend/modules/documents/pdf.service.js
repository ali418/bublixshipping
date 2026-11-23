'use strict';

const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '../../assets/logo.jpg');
const TEAL = '#0A5C6B';
const GOLD = '#C9A227';
const LIGHT_GRAY = '#F5F5F5';
const DARK = '#1A1A2E';

/**
 * Generate a Code128 barcode buffer
 */
async function generateBarcode(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: 2,
      height: 12,
      includetext: false,
    }, (err, png) => {
      if (err) reject(err);
      else resolve(png);
    });
  });
}

/**
 * Generate QR Code buffer
 */
async function generateQR(text) {
  return QRCode.toBuffer(text, { type: 'png', width: 100, margin: 1 });
}

/**
 * Draw the Bublix Shipping header with logo
 */
function drawHeader(doc, hubName = 'Kampala HQ') {
  // Background bar
  doc.rect(0, 0, doc.page.width, 90).fill(TEAL);

  // Logo
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 20, 10, { height: 70, fit: [100, 70] });
  }

  // Company name
  doc.fillColor('white')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('BUBLIX SHIPPING', 130, 20);

  doc.fontSize(9)
    .font('Helvetica')
    .fillColor(GOLD)
    .text('bublixshipping.com', 130, 44)
    .fillColor('white')
    .text(`Branch: ${hubName}`, 130, 57)
    .text('Tel: +256 700 000 000', 130, 69);

  doc.moveDown();
}

/**
 * Draw a labeled info cell
 */
function labeledCell(doc, x, y, w, h, label, value, opts = {}) {
  doc.rect(x, y, w, h).fill(opts.bgColor || LIGHT_GRAY).stroke('#DDDDDD');
  doc.fillColor(TEAL).fontSize(7).font('Helvetica-Bold').text(label, x + 4, y + 3, { width: w - 8 });
  doc.fillColor(DARK).fontSize(opts.valueSize || 10).font('Helvetica-Bold').text(value || '—', x + 4, y + 14, { width: w - 8 });
}

/**
 * Generate Waybill PDF
 */
async function generateWaybill(shipment, hubName = 'Kampala HQ') {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const buffers = [];
      doc.on('data', (d) => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const trackingNumber = shipment.trackingNumber;
      const W = doc.page.width;

      // ── Header ─────────────────────────────────────────────────────
      drawHeader(doc, hubName);

      // ── Title bar ──────────────────────────────────────────────────
      doc.rect(0, 92, W, 24).fill(GOLD);
      doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold')
        .text('AIR WAYBILL / SHIPPING DOCUMENT', 0, 98, { align: 'center', width: W });

      // ── Tracking Number (large) ────────────────────────────────────
      doc.rect(20, 124, W - 40, 36).fill(DARK);
      doc.fillColor(GOLD).fontSize(22).font('Helvetica-Bold')
        .text(trackingNumber, 20, 133, { align: 'center', width: W - 40 });

      // ── Barcode ────────────────────────────────────────────────────
      let barcodeY = 170;
      try {
        const barcodeBuffer = await generateBarcode(trackingNumber);
        const barcodeWidth = 260;
        doc.image(barcodeBuffer, (W - barcodeWidth) / 2, barcodeY, { width: barcodeWidth });
        barcodeY += 55;
      } catch {}

      // ── Shipment Info Grid ─────────────────────────────────────────
      const colW = (W - 40) / 2;
      let gy = barcodeY + 10;
      const cellH = 40;

      // Row 1
      labeledCell(doc, 20, gy, colW, cellH, 'SHIPMENT TYPE', shipment.shipmentType);
      labeledCell(doc, 20 + colW, gy, colW, cellH, 'SERVICE', shipment.service?.name || '—');
      gy += cellH;

      // Row 2 — Sender
      const senderFull = `${shipment.senderNameSnapshot}\n${shipment.senderPhoneSnapshot}`;
      labeledCell(doc, 20, gy, colW * 2, 55, 'SENDER', senderFull, { valueSize: 11 });
      gy += 55;

      // Row 3 — Receiver
      const receiverAddr = shipment.receiverAddress
        ? (shipment.receiverAddress.addressLine1 || '') : '';
      const receiverFull = `${shipment.receiverName}\n${shipment.receiverPhone}${receiverAddr ? '\n' + receiverAddr : ''}`;
      labeledCell(doc, 20, gy, colW * 2, 55, 'RECEIVER', receiverFull, { valueSize: 11 });
      gy += 55;

      // Row 4 — Route
      const originName = shipment.originCountry?.name || '';
      const destName = shipment.destinationCountry?.name || '';
      labeledCell(doc, 20, gy, colW, cellH, 'ORIGIN', originName);
      labeledCell(doc, 20 + colW, gy, colW, cellH, 'DESTINATION', destName);
      gy += cellH;

      // Row 5 — Hub
      const originHub = shipment.originHub?.name || '';
      const destHub = shipment.destinationHub?.name || '';
      labeledCell(doc, 20, gy, colW, cellH, 'ORIGIN HUB', originHub);
      labeledCell(doc, 20 + colW, gy, colW, cellH, 'DESTINATION HUB', destHub);
      gy += cellH;

      // Row 6 — Weight
      labeledCell(doc, 20, gy, colW / 2, cellH, 'ACTUAL WT (kg)', `${shipment.actualWeight}`);
      labeledCell(doc, 20 + colW / 2, gy, colW / 2, cellH, 'CHARGEABLE WT', `${shipment.chargeableWeight}`);
      labeledCell(doc, 20 + colW, gy, colW / 2, cellH, 'PIECES', `${shipment.totalPieces}`);
      labeledCell(doc, 20 + colW * 1.5, gy, colW / 2, cellH, 'PAYMENT METHOD', shipment.paymentMethod);
      gy += cellH;

      // Row 7 — Financial
      const totalAmt = `${parseFloat(shipment.totalAmount).toFixed(2)} ${shipment.currency}`;
      const codAmt = parseFloat(shipment.codAmount) > 0
        ? `${parseFloat(shipment.codAmount).toFixed(2)} ${shipment.codCurrency || shipment.currency}`
        : 'N/A';
      labeledCell(doc, 20, gy, colW, cellH, 'SHIPPING CHARGE', totalAmt, { bgColor: '#E8F5E9' });
      labeledCell(doc, 20 + colW, gy, colW, cellH, 'COD AMOUNT', codAmt, { bgColor: codAmt !== 'N/A' ? '#FFF3E0' : LIGHT_GRAY });
      gy += cellH;

      // Row 8 — EDD + Instructions
      const edd = shipment.estimatedDeliveryDate
        ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('en-GB')
        : 'TBA';
      labeledCell(doc, 20, gy, colW, cellH, 'EST. DELIVERY', edd);
      labeledCell(doc, 20 + colW, gy, colW, cellH, 'SPECIAL INSTRUCTIONS', shipment.specialInstructions || 'None');
      gy += cellH + 10;

      // ── QR Code ────────────────────────────────────────────────────
      try {
        const qrBuffer = await generateQR(`https://bublixshipping.com/tracking/${trackingNumber}`);
        doc.image(qrBuffer, W - 110, gy - 160, { width: 85 });
        doc.fillColor(TEAL).fontSize(7).text('Scan to Track', W - 110, gy - 73, { width: 85, align: 'center' });
      } catch {}

      // ── Items Table ────────────────────────────────────────────────
      if (shipment.items && shipment.items.length > 0) {
        doc.rect(20, gy, W - 40, 18).fill(TEAL);
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
          .text('SHIPMENT CONTENTS', 24, gy + 5);
        gy += 18;

        const colWidths = [200, 60, 60, 80];
        const headers = ['Description', 'Qty', 'Weight (kg)', 'Value'];
        headers.forEach((h, i) => {
          const x = 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.rect(x, gy, colWidths[i], 16).fill('#E0E0E0').stroke('#CCCCCC');
          doc.fillColor(DARK).fontSize(7).font('Helvetica-Bold').text(h, x + 3, gy + 4, { width: colWidths[i] - 6 });
        });
        gy += 16;

        for (const item of shipment.items) {
          const vals = [item.description, item.quantity, item.weight || '—', item.unitValue ? `${item.unitValue} ${item.currency || ''}` : '—'];
          vals.forEach((v, i) => {
            const x = 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, gy, colWidths[i], 16).fill('white').stroke('#EEEEEE');
            doc.fillColor(DARK).fontSize(8).font('Helvetica').text(String(v), x + 3, gy + 4, { width: colWidths[i] - 6 });
          });
          gy += 16;
        }
        gy += 10;
      }

      // ── Footer ─────────────────────────────────────────────────────
      const footerY = doc.page.height - 60;
      doc.rect(0, footerY, W, 60).fill(TEAL);
      doc.fillColor('white').fontSize(7)
        .text('BUBLIX SHIPPING – bublixshipping.com | info@bublixshipping.com | +256 700 000 000', 20, footerY + 8, { align: 'center', width: W - 40 })
        .fillColor(GOLD)
        .text(`Generated: ${new Date().toLocaleString('en-GB')} | ${trackingNumber}`, 20, footerY + 22, { align: 'center', width: W - 40 })
        .fillColor('white').fontSize(6)
        .text('This document is computer-generated and valid without signature.', 20, footerY + 36, { align: 'center', width: W - 40 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate compact Shipping Label (10cm × 15cm equivalent in PDF)
 */
async function generateShippingLabel(shipment) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [283, 425], margin: 0 }); // ~10x15cm
      const buffers = [];
      doc.on('data', (d) => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = 283;
      const trackingNumber = shipment.trackingNumber;

      // Header
      doc.rect(0, 0, W, 50).fill(TEAL);
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 5, 5, { height: 40, fit: [60, 40] });
      }
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold').text('BUBLIX SHIPPING', 72, 10);
      doc.fillColor(GOLD).fontSize(7).text('bublixshipping.com', 72, 25);

      // Tracking Number
      doc.rect(0, 50, W, 32).fill(DARK);
      doc.fillColor(GOLD).fontSize(14).font('Helvetica-Bold')
        .text(trackingNumber, 0, 59, { align: 'center', width: W });

      // Barcode
      let y = 90;
      try {
        const barcodeBuffer = await generateBarcode(trackingNumber);
        doc.image(barcodeBuffer, 20, y, { width: W - 40 });
        y += 48;
      } catch { y += 10; }

      // Route
      const origin = shipment.originCountry?.name || '';
      const dest = shipment.destinationCountry?.name || '';
      doc.rect(0, y, W / 2, 28).fill('#E8F5E9');
      doc.rect(W / 2, y, W / 2, 28).fill('#FFF3E0');
      doc.fillColor(TEAL).fontSize(6).font('Helvetica-Bold').text('FROM', 5, y + 3);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(origin, 5, y + 12, { width: W / 2 - 10 });
      doc.fillColor(TEAL).fontSize(6).text('TO', W / 2 + 5, y + 3);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(dest, W / 2 + 5, y + 12, { width: W / 2 - 10 });
      y += 28;

      // Receiver
      doc.rect(0, y, W, 55).fill(LIGHT_GRAY);
      doc.fillColor(TEAL).fontSize(7).font('Helvetica-Bold').text('DELIVER TO:', 5, y + 4);
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(shipment.receiverName, 5, y + 15, { width: W - 10 });
      doc.fontSize(8).font('Helvetica').text(shipment.receiverPhone, 5, y + 29);
      if (shipment.receiverAddress?.addressLine1) {
        doc.fontSize(7).text(shipment.receiverAddress.addressLine1, 5, y + 41, { width: W - 10 });
      }
      y += 55;

      // Info row
      doc.rect(0, y, W / 3, 24).fill('white').stroke('#DDD');
      doc.rect(W / 3, y, W / 3, 24).fill('white').stroke('#DDD');
      doc.rect((W * 2) / 3, y, W / 3, 24).fill('white').stroke('#DDD');
      doc.fillColor(TEAL).fontSize(6).font('Helvetica-Bold');
      doc.text('WT (kg)', 4, y + 3).text('PIECES', W / 3 + 4, y + 3).text('METHOD', (W * 2) / 3 + 4, y + 3);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold');
      doc.text(`${shipment.chargeableWeight}`, 4, y + 13).text(`${shipment.totalPieces}`, W / 3 + 4, y + 13).text(shipment.paymentMethod, (W * 2) / 3 + 4, y + 13, { width: W / 3 - 8 });
      y += 24;

      // COD if applicable
      if (parseFloat(shipment.codAmount) > 0) {
        doc.rect(0, y, W, 22).fill('#FFF3E0');
        doc.fillColor(TEAL).fontSize(7).font('Helvetica-Bold').text('COD AMOUNT:', 5, y + 4);
        doc.fillColor('#E65100').fontSize(11).font('Helvetica-Bold')
          .text(`${parseFloat(shipment.codAmount).toFixed(2)} ${shipment.codCurrency || ''}`, 90, y + 3);
        y += 22;
      }

      // QR
      try {
        const qrBuffer = await generateQR(`https://bublixshipping.com/tracking/${trackingNumber}`);
        doc.image(qrBuffer, W - 70, y + 5, { width: 60 });
      } catch {}
      doc.fillColor(TEAL).fontSize(7).text('Scan to Track', W - 70, y + 68, { width: 60, align: 'center' });

      // Footer
      const fY = 425 - 25;
      doc.rect(0, fY, W, 25).fill(TEAL);
      doc.fillColor('white').fontSize(6)
        .text(`${new Date().toLocaleDateString('en-GB')} | Bublix Shipping`, 0, fY + 8, { align: 'center', width: W });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateWaybill, generateShippingLabel };
