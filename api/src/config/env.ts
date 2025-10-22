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
] as const;

export type ProdRequired = typeof requiredEnvInProd[number];
export type Optional = typeof optionalEnv[number];

// Note: Validation logic will be added in T076
// For now, this module just documents the contract
