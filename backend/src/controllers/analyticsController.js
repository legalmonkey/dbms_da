const analyticsService = require('../services/analyticsService');
const { sendItem } = require('../utils/response');

async function getWorkspaceSummary(req, res, next) {
  try {
    const summary = await analyticsService.getWorkspaceSummary();
    return sendItem(res, summary);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWorkspaceSummary,
};

