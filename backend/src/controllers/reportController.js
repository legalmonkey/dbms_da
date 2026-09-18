const reportService = require('../services/reportService');
const { sendItem, sendPaginated, sendList, sendError } = require('../utils/response');

async function getReports(req, res, next) {
  try {
    const result = await reportService.getReports(req.query);
    return sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

async function getReportById(req, res, next) {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return sendError(res, 'NOT_FOUND', 'Report not found', 404);
    }
    return sendItem(res, report);
  } catch (error) {
    next(error);
  }
}

async function getPendingResults(req, res, next) {
  try {
    const pending = await reportService.getPendingResults();
    return sendList(res, pending);
  } catch (error) {
    next(error);
  }
}

async function saveReportResults(req, res, next) {
  try {
    const report = await reportService.saveReportResults(req.params.id, req.body);
    return sendItem(res, report);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReports,
  getReportById,
  getPendingResults,
  saveReportResults,
};

