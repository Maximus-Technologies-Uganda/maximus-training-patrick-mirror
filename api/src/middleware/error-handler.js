const { statusByCode } = require('../lib/errors');

function errorHandler(err, _req, res, _next) {
  // Allow explicit status codes set upstream (e.g., from libraries)
  const explicit = err.status || err.statusCode;
  const mapped = statusByCode[err.code];
  const status = explicit || mapped || 500;
  res.status(status).json({
    code: err.code || 'internal_error',
    message: err.message || 'Internal Server Error',
    details: err.details
  });
}

module.exports = { errorHandler };


