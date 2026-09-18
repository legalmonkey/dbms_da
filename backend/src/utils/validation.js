/**
 * Common Validation and Helper Utilities.
 */

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Validates whether a phone number matches standard 10-digit Indian format.
 */
function isValidIndianMobile(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return INDIAN_MOBILE_REGEX.test(phone.trim());
}

/**
 * Generates the next sequential alphanumeric identifier (e.g., 'P0001', 'T0001', 'ORD-0001').
 */
function generateNextId(existingIds, prefix, minDigits = 4) {
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  for (const id of existingIds) {
    const match = String(id).match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(minDigits, '0')}`;
}

/**
 * Sanitizes and parses pagination parameters with safe defaults.
 */
function parsePagination(query, defaultPageSize = 20, maxPageSize = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedSize = parseInt(query.pageSize, 10) || defaultPageSize;
  const pageSize = Math.min(maxPageSize, Math.max(1, requestedSize));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

module.exports = {
  isValidIndianMobile,
  generateNextId,
  parsePagination,
};

