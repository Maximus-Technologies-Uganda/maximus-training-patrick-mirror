// TypeScript server entrypoint that boots the app with an in-memory repository
// for development and testing environments.

import { loadConfigFromEnv } from './config';
import { createInMemoryRepository } from './repositories/factory';
// Use CommonJS require for the app factory to align with ts-jest configuration
// and avoid ESM/CJS interop pitfalls.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('./app');

const config = loadConfigFromEnv();
const repository = createInMemoryRepository();
const app = createApp(config, repository);

export { app };

const port = config.port;
if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
}


