// TypeScript server entrypoint that boots the app with an in-memory repository
// for development and testing environments.

/* eslint-disable no-console */
import { loadConfigFromEnv } from './config';
import { createInMemoryRepository } from './repositories/factory';
import { createApp } from './app';

console.log('Server startup: Initializing...');

let app;
let config;
try {
  console.log('Server startup: Loading config...');
  config = loadConfigFromEnv();
  console.log(`Server startup: Config loaded, port config=${config.port}`);

  console.log('Server startup: Creating repository...');
  const repository = createInMemoryRepository();
  console.log('Server startup: Repository created');

  console.log('Server startup: Creating app...');
  app = createApp(config, repository);
  console.log('Server startup: App created successfully');
} catch (error) {
  console.error(`Server startup FAILED: ${error instanceof Error ? error.message : String(error)}`);
  if (error instanceof Error && error.stack) {
    console.error(`Stack: ${error.stack}`);
  }
  process.exit(1);
}

export { app };

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;
console.log(`Server startup: Using port=${port}, PORT env=${process.env.PORT || 'not set'}`);

// Use CommonJS-friendly check to avoid ESM-only import.meta in build
if (require.main === module) {
  console.log('Server startup: Starting HTTP listener...');
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server startup SUCCESS: API listening on port ${port}`);
  });

  server.on('error', (error) => {
    console.error(`Server error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
} else {
  console.log('Server startup: Module loaded but not main - export only');
}
