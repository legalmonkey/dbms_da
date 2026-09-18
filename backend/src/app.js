const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { checkDatabaseConnection } = require('./config/db');
const { notFoundHandler } = require('./middleware/notFoundMiddleware');
const { errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const testRoutes = require('./routes/testRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sampleRoutes = require('./routes/sampleRoutes');
const laboratoryRoutes = require('./routes/laboratoryRoutes');
const staffRoutes = require('./routes/staffRoutes');
const reportRoutes = require('./routes/reportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportController = require('./controllers/reportController');

const app = express();

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',').map((o) => o.trim()) : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------------
// HEALTH CHECK ENDPOINT
// -----------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  const systemName = process.env.SYSTEM_NAME || 'Meridian Diagnostics LIS/LIMS';
  const dbHealth = await checkDatabaseConnection();

  if (dbHealth.connected) {
    return res.status(200).json({
      success: true,
      message: 'Backend and database are connected',
      system: systemName,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    success: false,
    message: 'Database connection failed',
    system: systemName,
    error: dbHealth.message || 'Unable to connect to Oracle database',
    timestamp: new Date().toISOString(),
  });
});

// Demo reset endpoint for frontend compatibility
app.post('/api/demo/reset', (req, res) => {
  return res.status(200).json({
    ok: true,
    message: 'Live database mode active. Reset operation acknowledged.',
  });
});

// -----------------------------------------------------------------------------
// REST API ROUTES
// -----------------------------------------------------------------------------
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/laboratories', laboratoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
// Direct mounting for exact contract path: /api/pending-results
app.get('/api/pending-results', reportController.getPendingResults);
app.use('/api/analytics', analyticsRoutes);

// -----------------------------------------------------------------------------
// ERROR HANDLING MIDDLEWARES
// -----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

