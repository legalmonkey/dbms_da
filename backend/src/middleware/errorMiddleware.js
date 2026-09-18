const { sendError } = require('../utils/response');

/**
 * Global error handler middleware.
 * Ensures that stack traces and database credentials are never exposed in production.
 */
function errorHandler(err, req, res, next) {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle explicit API errors
  if (err.statusCode || err.status) {
    const status = err.statusCode || err.status;
    return sendError(res, err.code || 'ERROR', err.message, status, err.fieldErrors);
  }

  // Handle MySQL error codes cleanly
  if (err.code) {
    // Foreign key violation when deleting
    if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
      return sendError(
        res,
        'CONFLICT',
        'Cannot delete or modify record because it is referenced by other active records',
        409
      );
    }

    // Foreign key violation when inserting/updating
    if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
      return sendError(
        res,
        'VALIDATION_FAILED',
        'Referenced parent record does not exist',
        400
      );
    }

    // Duplicate primary/unique key
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(
        res,
        'CONFLICT',
        'A record with this identifier already exists',
        409
      );
    }

    // Database connection failure
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('[DATABASE_ERROR]', err.message);
      return sendError(
        res,
        'DATABASE_UNAVAILABLE',
        'Database service is currently unreachable',
        503
      );
    }
  }

  // General server error
  console.error('[UNHANDLED_ERROR]', err);
  const isDev = process.env.NODE_ENV === 'development';
  return sendError(
    res,
    'SERVER_ERROR',
    isDev ? err.message : 'An unexpected server error occurred',
    500
  );
}

module.exports = {
  errorHandler,
};

