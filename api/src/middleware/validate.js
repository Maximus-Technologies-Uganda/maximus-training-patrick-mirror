const { makeError } = require('../lib/errors');

function validateBody(schema) {
  return function(req, _res, next) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()));
    }
    // replace with parsed/sanitized data (defaults applied)
    req.body = parsed.data;
    next();
  };
}

function validateQuery(schema) {
  return function(req, _res, next) {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return next(makeError('validation_error', 'Invalid query parameters', parsed.error.flatten()));
    }
    // attach validated/coerced query without mutating framework-managed req.query
    req.validatedQuery = parsed.data;
    next();
  };
}

module.exports = { validateBody, validateQuery };


