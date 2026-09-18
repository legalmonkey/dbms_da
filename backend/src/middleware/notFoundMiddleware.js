const { sendError } = require('../utils/response');

/**
 * 404 handler for unknown routes.
 */
function notFoundHandler(req, res) {
  return sendError(
    res,
    'NOT_FOUND',
    `Cannot ${req.method} ${req.originalUrl}`,
    404
  );
}

module.exports = {
  notFoundHandler,
};

