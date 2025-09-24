const { makeError } = require('../lib/errors');

function notFoundHandler(_req, _res, next) {
  next(makeError('not_found', 'Not Found'));
}

module.exports = { notFoundHandler };



