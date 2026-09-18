const testService = require('../services/testService');
const { sendItem, sendList, sendSuccess, sendError } = require('../utils/response');

async function getTests(req, res, next) {
  try {
    const tests = await testService.getTests(req.query);
    return sendList(res, tests);
  } catch (error) {
    next(error);
  }
}

async function getTestById(req, res, next) {
  try {
    const test = await testService.getTestById(req.params.id);
    if (!test) {
      return sendError(res, 'NOT_FOUND', 'Test not found', 404);
    }
    return sendItem(res, test);
  } catch (error) {
    next(error);
  }
}

async function createTest(req, res, next) {
  try {
    const created = await testService.createTest(req.body);
    return sendItem(res, created, 201);
  } catch (error) {
    next(error);
  }
}

async function updateTest(req, res, next) {
  try {
    const updated = await testService.updateTest(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'NOT_FOUND', 'Test not found', 404);
    }
    return sendItem(res, updated);
  } catch (error) {
    next(error);
  }
}

async function deleteTest(req, res, next) {
  try {
    const success = await testService.deleteTest(req.params.id);
    if (!success) {
      return sendError(res, 'NOT_FOUND', 'Test not found', 404);
    }
    return sendSuccess(res, 'Test deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
};

