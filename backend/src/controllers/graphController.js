/**
 * Graph Controller - Meridian Diagnostics LIS/LIMS
 * Exposes endpoints for Neo4j Graph queries, visualizations, and Cypher executions.
 */

const graphService = require('../services/graphService');
const { sendItem, sendSuccess } = require('../utils/response');

async function getOverview(req, res, next) {
  try {
    const overview = await graphService.getOverview();
    return sendItem(res, overview);
  } catch (error) {
    next(error);
  }
}

async function getNetwork(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '150', 10);
    const network = await graphService.getGraphNetwork(limit);
    return sendItem(res, network);
  } catch (error) {
    next(error);
  }
}

async function traceContamination(req, res, next) {
  try {
    const equipmentId = req.query.equipmentId || 'EQ-COBAS-01';
    const result = await graphService.traceContamination(equipmentId);
    return sendItem(res, result);
  } catch (error) {
    next(error);
  }
}

async function getHereditaryRisk(req, res, next) {
  try {
    const patientId = req.query.patientId || 'P-1001';
    const result = await graphService.getHereditaryRisk(patientId);
    return sendItem(res, result);
  } catch (error) {
    next(error);
  }
}

async function getCoOccurrence(req, res, next) {
  try {
    const result = await graphService.getCoOccurrenceNetwork();
    return sendItem(res, result);
  } catch (error) {
    next(error);
  }
}

async function runCypher(req, res, next) {
  try {
    const { query, params } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'A valid Cypher query string is required in the request body.' });
    }
    const result = await graphService.runDemonstrationQuery(query, params || {});
    return sendItem(res, result);
  } catch (error) {
    next(error);
  }
}

async function seedData(req, res, next) {
  try {
    const result = await graphService.seedGraphData();
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getNetwork,
  traceContamination,
  getHereditaryRisk,
  getCoOccurrence,
  runCypher,
  seedData,
};
