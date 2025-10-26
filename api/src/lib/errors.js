// Centralized error helpers and status mapping

const statusByCode = {
  validation_error: 422,
  not_found: 404,
  rate_limit_exceeded: 429,
  payload_too_large: 413,
  service_unavailable: 503,
};

const NO_STORE_STATUSES = new Set([401, 403, 413, 422, 429, 503]);

function shouldPreventCache(status) {
  const numeric = Number(status);
  return Number.isFinite(numeric) && NO_STORE_STATUSES.has(numeric);
}

function setCacheControlNoStore(res, status) {
  if (!res || typeof res.setHeader !== 'function') return;
  if (!shouldPreventCache(status)) return;
  res.setHeader('Cache-Control', 'no-store');
}

function makeError(code, message, details) {
  const err = new Error(message || code);
  err.code = code;
  if (details !== undefined) {
    err.details = details;
  }
  return err;
}

module.exports = { makeError, statusByCode, shouldPreventCache, setCacheControlNoStore };


