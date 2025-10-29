/**
 * T103: CORS invariants validation for production
 * - If ALLOW_CREDENTIALS=true and CORS_ORIGINS includes '*' (wildcard) in production, fail fast
 */
export function assertCorsProdInvariants(): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;
  const allowCreds = String(process.env.ALLOW_CREDENTIALS || '').toLowerCase() === 'true';
  const originsRaw = String(process.env.CORS_ORIGINS || '').trim();
  const origins = originsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowCreds && origins.includes('*')) {
    throw new Error('[cors] Invalid production config: ALLOW_CREDENTIALS=true with CORS_ORIGINS=*');
  }
}

