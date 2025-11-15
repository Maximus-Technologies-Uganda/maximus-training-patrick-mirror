// TypeScript server entrypoint that boots the app with an in-memory repository
// for development and testing environments.

import { loadConfigFromEnv } from './config';
import { createInMemoryRepository } from './repositories/factory';
import { createApp } from './app';

let app;
let config;
try {
  config = loadConfigFromEnv();
  const repository = createInMemoryRepository();
  app = createApp(config, repository);
} catch (error) {
  process.stderr.write(
    `Failed to initialize API: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

export { app };

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;
// Use CommonJS-friendly check to avoid ESM-only import.meta in build
if (require.main === module) {
  const server = app.listen(port, '0.0.0.0', () => {
    process.stdout.write(`API listening on port ${port}\n`);
  });

  server.on('error', (error) => {
    process.stderr.write(
      `Server error: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
}
