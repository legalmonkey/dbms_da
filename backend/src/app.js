const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { checkDatabaseConnection } = require('./config/db');
const { checkNeo4jConnection } = require('./config/neo4j');
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
const graphRoutes = require('./routes/graphRoutes');
const reportController = require('./controllers/reportController');

const app = express();

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedList = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());
      if (
        allowedList.includes('*') ||
        allowedList.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------------
// HEALTH CHECK ENDPOINT (Polyglot: Relational + Neo4j Graph)
// -----------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  const systemName = process.env.SYSTEM_NAME || 'Meridian Diagnostics LIS/LIMS';
  const [dbHealth, neo4jHealth] = await Promise.all([
    checkDatabaseConnection(),
    checkNeo4jConnection(),
  ]);

  const allConnected = dbHealth.connected && neo4jHealth.connected;
  const status = dbHealth.connected ? 200 : 503;

  return res.status(status).json({
    success: dbHealth.connected,
    message: dbHealth.connected ? 'Backend and database are connected' : 'Database connection issues detected',
    system: systemName,
    relationalDb: {
      connected: dbHealth.connected,
      engine: 'Oracle / SQL*Plus',
      status: dbHealth.status || dbHealth.message,
    },
    graphDb: {
      connected: neo4jHealth.connected,
      engine: 'Neo4j Graph Database (Bolt)',
      address: neo4jHealth.address || 'Disconnected',
      version: neo4jHealth.version,
    },
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
app.use('/api/graph', graphRoutes);

// -----------------------------------------------------------------------------
// ERROR HANDLING MIDDLEWARES
// -----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

