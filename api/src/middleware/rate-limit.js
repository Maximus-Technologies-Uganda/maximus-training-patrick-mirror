const rateLimit = require('express-rate-limit');
const { makeError } = require('../lib/errors');

function createRateLimiter(config) {
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
      res.status(429).json({
        code: 'rate_limit_exceeded',
        message: 'Too Many Requests',
        details: { retryAfterSeconds }
      });
    }
  });
}

module.exports = { createRateLimiter };


