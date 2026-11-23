'use strict';

const nodemailer = require('nodemailer');

// ── Email Transporter ──────────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

// ── Shipment Status Labels ─────────────────────────────────────────────────────
const STATUS_MESSAGES = {
  CREATED: { subject: 'Shipment Created ✅', body: 'Your shipment has been created and is awaiting pickup.' },
  PICKED_UP: { subject: 'Shipment Picked Up 📦', body: 'Your shipment has been collected and is on its way to our hub.' },
  AT_ORIGIN_HUB: { subject: 'At Origin Hub 🏭', body: 'Your shipment has arrived at our origin hub and is being processed.' },
  IN_TRANSIT: { subject: 'Shipment In Transit 🚛', body: 'Your shipment is on its way to the destination.' },
  AT_DESTINATION_HUB: { subject: 'Arrived at Destination 🏬', body: 'Your shipment has arrived at the destination hub.' },
  CUSTOMS_CLEARANCE: { subject: 'Customs Processing 🛃', body: 'Your shipment is currently undergoing customs clearance.' },
  OUT_FOR_DELIVERY: { subject: 'Out for Delivery 🏍️', body: 'Your shipment is out for delivery today. Please be available to receive it.' },
  DELIVERED: { subject: 'Shipment Delivered ✅', body: 'Your shipment has been successfully delivered. Thank you for choosing Bublix Shipping!' },
  ON_HOLD: { subject: 'Shipment On Hold ⏸️', body: 'Your shipment has been placed on hold. Our team will contact you.' },
  DELIVERY_FAILED: { subject: 'Delivery Attempt Failed ❌', body: 'We were unable to deliver your shipment. We will retry soon.' },
  RETURNED: { subject: 'Shipment Returned ↩️', body: 'Your shipment is being returned to the sender.' },
};

// ── Build HTML Email ───────────────────────────────────────────────────────────
function buildEmailHTML(trackingNumber, receiverName, status, notes) {
  const msg = STATUS_MESSAGES[status] || { subject: 'Shipment Update', body: 'Your shipment status has been updated.' };
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #0A5C6B; padding: 24px 30px; text-align: center; }
    .header h1 { color: #C9A227; margin: 0; font-size: 22px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px; }
    .body { padding: 30px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 16px; }
    .tracking-box { background: #0A5C6B; color: #C9A227; text-align: center; padding: 16px; border-radius: 10px; font-size: 22px; font-weight: bold; font-family: monospace; letter-spacing: 2px; margin: 20px 0; }
    .status-box { background: #f0faf5; border-left: 4px solid #0A5C6B; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .status-box h3 { margin: 0 0 6px; color: #0A5C6B; }
    .status-box p { margin: 0; color: #555; font-size: 14px; }
    .cta { text-align: center; margin: 24px 0; }
    .btn { background: #C9A227; color: #1A1A2E; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; }
    .footer { background: #f9f9f9; padding: 16px 30px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999; }
    .footer a { color: #0A5C6B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 BUBLIX SHIPPING</h1>
      <p>bublixshipping.com</p>
    </div>
    <div class="body">
      <p class="greeting">Dear <strong>${receiverName}</strong>,</p>
      <div class="tracking-box">${trackingNumber}</div>
      <div class="status-box">
        <h3>${msg.subject}</h3>
        <p>${msg.body}</p>
        ${notes ? `<p style="margin-top:8px;color:#777;font-style:italic;">${notes}</p>` : ''}
      </div>
      <div class="cta">
        <a href="https://bublixshipping.com/tracking/${trackingNumber}" class="btn">
          Track Your Shipment →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>📍 Kampala, Uganda &nbsp;|&nbsp; 📞 +256 700 000 000</p>
      <p>© ${new Date().getFullYear()} <a href="https://bublixshipping.com">Bublix Shipping</a>. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Send Email Notification ────────────────────────────────────────────────────
async function sendEmailNotification({ to, receiverName, trackingNumber, status, notes }) {
  if (!process.env.EMAIL_USER || !to) return { sent: false, reason: 'Email not configured or no recipient' };

  const msg = STATUS_MESSAGES[status] || { subject: 'Shipment Update' };
  const html = buildEmailHTML(trackingNumber, receiverName, status, notes);

  try {
    const info = await getTransporter().sendMail({
      from: `"Bublix Shipping" <${process.env.EMAIL_USER}>`,
      to,
      subject: `[${trackingNumber}] ${msg.subject}`,
      html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { sent: false, error: err.message };
  }
}

// ── Build WhatsApp Message ─────────────────────────────────────────────────────
function buildWhatsAppMessage(trackingNumber, receiverName, status, notes) {
  const msg = STATUS_MESSAGES[status] || { body: 'Your shipment has been updated.' };
  return `🚚 *BUBLIX SHIPPING*\n\nDear ${receiverName},\n\n*Tracking #:* ${trackingNumber}\n*Status:* ${status.replace(/_/g, ' ')}\n\n${msg.body}${notes ? '\n\n_Note: ' + notes + '_' : ''}\n\n📍 Track your shipment:\nhttps://bublixshipping.com/tracking/${trackingNumber}\n\n_Bublix Shipping | bublixshipping.com_`;
}

// ── Send WhatsApp via API (Meta WhatsApp Business or similar) ─────────────────
async function sendWhatsAppNotification({ phone, receiverName, trackingNumber, status, notes }) {
  const WABA_TOKEN = process.env.WHATSAPP_API_TOKEN;
  const WABA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WABA_TOKEN || !WABA_PHONE_ID || !phone) {
    console.log('WhatsApp not configured — message would be:', buildWhatsAppMessage(trackingNumber, receiverName, status, notes));
    return { sent: false, reason: 'WhatsApp API not configured' };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${WABA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WABA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: buildWhatsAppMessage(trackingNumber, receiverName, status, notes) },
      }),
    });
    const json = await response.json();
    return { sent: response.ok, response: json };
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return { sent: false, error: err.message };
  }
}

// ── Send SMS via Africa's Talking (popular in Uganda/Africa) ──────────────────
async function sendSMSNotification({ phone, trackingNumber, status, notes }) {
  const AT_API_KEY = process.env.AT_API_KEY;
  const AT_USERNAME = process.env.AT_USERNAME;
  const AT_SENDER = process.env.AT_SENDER_ID || 'BublixSHP';

  const msg = STATUS_MESSAGES[status];
  const smsText = `Bublix Shipping: ${trackingNumber} - ${status.replace(/_/g, ' ')}. Track: bublixshipping.com/tracking/${trackingNumber}`;

  if (!AT_API_KEY || !AT_USERNAME || !phone) {
    console.log('SMS not configured — would send:', smsText);
    return { sent: false, reason: 'SMS API not configured' };
  }

  try {
    const params = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message: smsText,
      from: AT_SENDER,
    });

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const json = await response.json();
    return { sent: response.ok, response: json };
  } catch (err) {
    console.error('SMS send error:', err.message);
    return { sent: false, error: err.message };
  }
}

// ── Main Notification Dispatcher ───────────────────────────────────────────────
async function sendShipmentNotification(shipment, status, notes = '') {
  const results = { email: null, whatsapp: null, sms: null };

  const receiverName = shipment.receiverName;
  const trackingNumber = shipment.trackingNumber;
  const receiverPhone = shipment.receiverPhone;
  const receiverEmail = shipment.receiverEmail;

  // Run all notifications in parallel, never block shipment operation
  const promises = [];

  if (receiverEmail) {
    promises.push(
      sendEmailNotification({ to: receiverEmail, receiverName, trackingNumber, status, notes })
        .then((r) => { results.email = r; })
        .catch((err) => { results.email = { sent: false, error: err.message }; })
    );
  }

  if (receiverPhone) {
    promises.push(
      sendWhatsAppNotification({ phone: receiverPhone, receiverName, trackingNumber, status, notes })
        .then((r) => { results.whatsapp = r; })
        .catch((err) => { results.whatsapp = { sent: false, error: err.message }; }),

      sendSMSNotification({ phone: receiverPhone, trackingNumber, status, notes })
        .then((r) => { results.sms = r; })
        .catch((err) => { results.sms = { sent: false, error: err.message }; })
    );
  }

  await Promise.allSettled(promises);
  return results;
}

module.exports = {
  sendShipmentNotification,
  sendEmailNotification,
  sendWhatsAppNotification,
  sendSMSNotification,
  buildWhatsAppMessage,
};
