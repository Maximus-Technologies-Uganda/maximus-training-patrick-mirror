const rateLimit = require('express-rate-limit');

function createRateLimiter(config) {
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  });
}

module.exports = { createRateLimiter };


