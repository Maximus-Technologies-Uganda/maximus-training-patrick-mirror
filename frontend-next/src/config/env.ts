// T076 (frontend): Minimal env contract for Next.js runtime
// Names-only presence check helper (not enforced by default to avoid breaking tests)

export const frontendRequiredEnvInProd = [
  'NEXT_PUBLIC_API_URL',
] as const;

export type FrontendRequired = typeof frontendRequiredEnvInProd[number];

function hasFrontendEnvVar(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(process.env, key);
}

export function validateFrontendEnvOnBoot(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = frontendRequiredEnvInProd.filter((key) => !hasFrontendEnvVar(key));
  if (missing.length > 0) {
    throw new Error(`[frontend-config] Missing required env var(s): ${missing.join(', ')}`);
  }
}

