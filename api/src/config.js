function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function loadConfigFromEnv() {
  return {
    jsonLimit: process.env.JSON_LIMIT || '256kb',
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 100)
  };
}

module.exports = { loadConfigFromEnv };


