/**
 * Graph Routes - Meridian Diagnostics LIS/LIMS
 * Mounted at /api/graph
 */

const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

// High-level overview & node/edge counts
router.get('/overview', graphController.getOverview);

// Full interactive network graph (nodes and links)
router.get('/network', graphController.getNetwork);

// Multi-hop specimen contamination & biohazard audit
router.get('/contamination', graphController.traceContamination);

// Familial pedigree & hereditary disease risk
router.get('/hereditary', graphController.getHereditaryRisk);

// Diagnostic test co-occurrence patterns
router.get('/co-occurrence', graphController.getCoOccurrence);

// Live Cypher query execution for live faculty demo
router.post('/cypher', graphController.runCypher);

// Graph schema & seed data initialization
router.post('/seed', graphController.seedData);

module.exports = router;
