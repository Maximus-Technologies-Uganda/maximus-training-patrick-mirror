// Centralized error helpers and status mapping

const statusByCode = {
  validation_error: 400,
  not_found: 404,
  rate_limit_exceeded: 429
};

function makeError(code, message, details) {
  const err = new Error(message || code);
  err.code = code;
  if (details !== undefined) {
    err.details = details;
  }
  return err;
}

module.exports = { makeError, statusByCode };


