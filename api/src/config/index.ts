import { validateEnvOnBoot } from './env';

// Configuration loader that combines environment validation with defaults
export function loadConfigFromEnv(): {
  rateLimitMax: number;
  rateLimitWindowMs: number;
  allowOrigin: string;
  allowCredentials: boolean;
} {
  // Validate environment on boot (T076)
  validateEnvOnBoot();

  return {
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    allowOrigin: process.env.ALLOW_ORIGIN || 'http://localhost:3001',
    allowCredentials: process.env.ALLOW_CREDENTIALS === 'true',
  };
}

// Re-export environment utilities
export * from './env';
