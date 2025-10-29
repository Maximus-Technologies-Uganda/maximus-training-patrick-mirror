// Typed environment configuration stub
// Exported but not wired until T076
// This module defines which env vars are required in production vs optional

export const requiredEnvInProd = ['SESSION_SECRET'] as const;

export const optionalEnv = [
  'ALLOW_ORIGIN',
  'ALLOW_CREDENTIALS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'HEALTHCHECK_FIREBASE_ADMIN_PING',
  'HEALTHCHECK_TIMEOUT_MS',
  'HEALTHCHECK_FIREBASE_TIMEOUT_MS',
  'HEALTHCHECK_DATABASE_TIMEOUT_MS',
] as const;

export type ProdRequired = typeof requiredEnvInProd[number];
export type Optional = typeof optionalEnv[number];

/**
 * T076: Validate required environment variable names on boot.
 * Only checks presence of names (not values) and only in production.
 */
function hasEnvVar(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(process.env, key);
}

export function validateEnvOnBoot(): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  const missing = requiredEnvInProd.filter((key) => !hasEnvVar(key));
  if (missing.length > 0) {
    throw new Error(`[config] Missing required env var(s): ${missing.join(', ')}`);
  }
}

// Note: Validation logic will be added in T076
// For now, this module just documents the contract
