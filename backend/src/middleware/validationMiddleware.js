const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Middleware that inspects express-validator results.
 * If validation issues exist, formats them as fieldErrors matching the API contract.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    const errorArray = errors.array();

    for (const err of errorArray) {
      const field = err.path || err.param;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = err.msg;
      }
    }

    const firstMessage = errorArray[0] ? errorArray[0].msg : 'Invalid request data';

    return sendError(res, 'VALIDATION_FAILED', firstMessage, 400, fieldErrors);
  }
  next();
}

module.exports = {
  handleValidationErrors,
};

