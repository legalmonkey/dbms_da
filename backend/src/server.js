const app = require('./app');
const { checkDatabaseConnection } = require('./config/db');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 8080;
const SYSTEM_NAME = process.env.SYSTEM_NAME || 'Meridian Diagnostics LIS/LIMS';

const server = app.listen(PORT, async () => {
  console.log('================================================================');
  console.log(`  ${SYSTEM_NAME} - Backend REST API Server`);
  console.log('================================================================');
  console.log(`  Status      : Online`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log('================================================================');

  // Verify DB connection on launch
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    console.log('  [DATABASE] Connected to Oracle Database successfully.');
  } else {
    console.warn(`  [DATABASE WARNING] Connection failed: ${dbHealth.message}`);
    console.warn('  Please check your .env database configuration.');
  }
  console.log('================================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

