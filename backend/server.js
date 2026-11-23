'use strict';

require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./modules/index');

const PORT = parseInt(process.env.PORT) || 5000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // NOTE: Schema managed via Sequelize CLI migrations — run `npm run db:migrate`
    // sequelize.sync() is intentionally disabled; migrations handle all DDL.

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║          🚀 BUBLIX SHIPPING API              ║
║                                              ║
║  Environment : ${(process.env.NODE_ENV || 'development').padEnd(29)}║
║  Port        : ${String(PORT).padEnd(29)}║
║  API Base    : /api/v1                       ║
║  Health      : http://localhost:${PORT}/health  ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
