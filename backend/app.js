'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const { responseFormatter, errorHandler, notFound } = require('./middleware/response.middleware');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const shipmentRoutes = require('./modules/shipments/shipment.routes');
const userRoutes = require('./modules/users/user.routes');
const hubRoutes = require('./modules/locations/hub.routes');
const locationRoutes = require('./modules/locations/locations.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const pricingRoutes = require('./modules/pricing/pricing.routes');
const financeRoutes = require('./modules/finance/finance.routes');
const reportRoutes = require('./modules/reports/reports.routes');
const documentRoutes = require('./modules/documents/documents.routes');

const app = express();

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/v1/auth/login', authLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Response Helpers ──────────────────────────────────────────────────────────
app.use(responseFormatter);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Bublix Shipping API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/hubs`, hubRoutes);
app.use(`${API_PREFIX}/locations`, locationRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/pricing`, pricingRoutes);
app.use(`${API_PREFIX}/finance`, financeRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/shipments`, shipmentRoutes);
app.use(`${API_PREFIX}/documents`, documentRoutes);

// Public tracking (no auth required)
app.get(`${API_PREFIX}/tracking/:trackingNumber`, async (req, res) => {
  const { getPublicTracking } = require('./modules/shipments/shipment.service');
  try {
    const data = await getPublicTracking(req.params.trackingNumber);
    if (!data) return res.status(404).json({ success: false, message: 'Shipment not found' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Tracking failed' });
  }
});

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
