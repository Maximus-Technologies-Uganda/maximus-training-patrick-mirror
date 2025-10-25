// Keep JS implementation for CommonJS consumers; TS imports use config.ts directly.
const requiredEnvInProd = ['SESSION_SECRET'];

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function hasEnvVar(key) {
  return Object.prototype.hasOwnProperty.call(process.env, key);
}

function validateEnvOnBoot() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = requiredEnvInProd.filter((key) => !hasEnvVar(key));
  if (missing.length > 0) {
    throw new Error(`[config] Missing required env var(s): ${missing.join(', ')}`);
  }
}

function loadConfigFromEnv() {
  validateEnvOnBoot();
  return {
    port: toInt(process.env.PORT, 3000),
    jsonLimit: process.env.JSON_LIMIT || '256kb',
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 100)
  };
}

function getSessionSecret() {
  const raw = (process.env.SESSION_SECRET || '').trim();
  const isProduction = process.env.NODE_ENV === 'production';
  if (!raw) {
    if (isProduction) {
      throw new Error('SESSION_SECRET must be set in production');
    }
    console.warn('[config] SESSION_SECRET is not set; using insecure dev default');
    return 'dev-secret';
  }
  return raw;
}

module.exports = { loadConfigFromEnv, getSessionSecret, validateEnvOnBoot };


