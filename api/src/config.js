// Load environment variables from a .env file if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch (_e) {
  // dotenv is optional in some environments; ignore if unavailable
}

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function loadConfigFromEnv() {
  return {
    port: toInt(process.env.PORT, 3000),
    jsonLimit: process.env.JSON_LIMIT || '256kb',
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 100)
  };
}

module.exports = { loadConfigFromEnv };


