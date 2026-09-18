const sampleService = require('../services/sampleService');
const { sendItem, sendPaginated, sendError } = require('../utils/response');

async function getSamples(req, res, next) {
  try {
    const result = await sampleService.getSamples(req.query);
    return sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

async function getSampleById(req, res, next) {
  try {
    const sample = await sampleService.getSampleById(req.params.id, req.query.orderId);
    if (!sample) {
      return sendError(res, 'NOT_FOUND', 'Sample not found', 404);
    }
    return sendItem(res, sample);
  } catch (error) {
    next(error);
  }
}

async function createSample(req, res, next) {
  try {
    const sample = await sampleService.createSample(req.body);
    return sendItem(res, sample, 201);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSamples,
  getSampleById,
  createSample,
};

