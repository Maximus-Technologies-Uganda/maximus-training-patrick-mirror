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
  return {
    port: toInt(process.env.PORT, 3000),
    jsonLimit: process.env.JSON_LIMIT || '256kb',
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 100),
  };
}

export default loadConfigFromEnv;


