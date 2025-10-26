import { validateEnvOnBoot } from "./config/env";

export interface AppConfig {
  port: number;
  jsonLimit: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? (n as number) : fallback;
}

export function loadConfigFromEnv(): AppConfig {
  validateEnvOnBoot();
  return {
    port: toInt(process.env.PORT, 3000),
    // T014/T047: Enforce 1MB JSON body limit for API requests
    jsonLimit: process.env.JSON_LIMIT || '1mb',
    // T015: Default rate limit window 60s and capacity 10 per key (user/IP)
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 10),
  };
}

export default loadConfigFromEnv;

// Session secret helper
// In production, a missing secret is a critical misconfiguration that would
// allow anyone to forge tokens. Fail fast at startup by throwing. In
// non-production, fall back to a predictable value for local dev/tests and log
// a warning so it is visible in CI logs.
export function getSessionSecret(): string {
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


