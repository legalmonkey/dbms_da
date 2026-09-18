/**
 * Standardized Response Formatter.
 * Adheres strictly to the frontend API contract and UI requirements.
 */

/**
 * Send a single record response.
 * Returns the object directly so frontend components receive the expected shape
 * without impedance mismatch, and attaches common fields.
 */
function sendItem(res, item, statusCode = 200) {
  return res.status(statusCode).json(item);
}

/**
 * Send a paginated list response.
 * Format: { data: [], total: number, page: number, pageSize: number }
 */
function sendPaginated(res, data, total, page, pageSize, statusCode = 200) {
  return res.status(statusCode).json({
    data: data || [],
    total: Number(total) || 0,
    page: Number(page) || 1,
    pageSize: Number(pageSize) || (data ? data.length : 0),
  });
}

/**
 * Send a non-paginated array response.
 * Directly returns the array expected by components (e.g. /doctors, /tests, /laboratories, /staff).
 */
function sendList(res, list, statusCode = 200) {
  return res.status(statusCode).json(list || []);
}

/**
 * Send a successful mutation/deletion response.
 */
function sendSuccess(res, message = 'Operation completed successfully', data = null, statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    success: true,
    message,
    ...(data ? { data } : {}),
  });
}

/**
 * Send a standardized error response.
 * Format: { code: string, message: string, fieldErrors?: {} }
 */
function sendError(res, code, message, statusCode = 400, fieldErrors = null) {
  const payload = {
    code: code || 'ERROR',
    message: message || 'An error occurred',
  };

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    payload.fieldErrors = fieldErrors;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendItem,
  sendPaginated,
  sendList,
  sendSuccess,
  sendError,
};

