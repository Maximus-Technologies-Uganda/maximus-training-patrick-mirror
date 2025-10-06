// TypeScript server entrypoint that boots the app with an in-memory repository
// for development and testing environments.

import { loadConfigFromEnv } from "./config";
import { createInMemoryRepository } from "./repositories/factory";
import { createApp } from "./app";

const config = loadConfigFromEnv();
const repository = createInMemoryRepository();
const app = createApp(config, repository);

export { app };

const port = config.port;
// Use CommonJS-friendly check to avoid ESM-only import.meta in build
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}


