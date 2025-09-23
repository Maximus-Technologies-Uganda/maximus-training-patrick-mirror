// TypeScript facade that re-exports JS config loader for test compatibility

export type AppConfig = {
  port: number;
  jsonLimit: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
};

export function loadConfigFromEnv(): AppConfig {
  const js = require('./config.js');
  return js.loadConfigFromEnv();
}


