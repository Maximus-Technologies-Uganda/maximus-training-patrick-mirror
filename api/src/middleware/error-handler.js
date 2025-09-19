const { statusByCode } = require('../lib/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const status = statusByCode[err.code] || 500;
  res.status(status).json({
    code: err.code || 'internal_error',
    message: err.message || 'Internal Server Error',
    details: err.details
  });
}

module.exports = { errorHandler };


