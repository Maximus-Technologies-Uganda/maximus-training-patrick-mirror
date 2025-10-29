const { createApp } = require('./app');
const { loadConfigFromEnv } = require('./config');
const { createRepository } = require('./repositories/posts-repository');

const config = loadConfigFromEnv();
const repository = createRepository();
const app = createApp(config, repository);

const port = config.port;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

module.exports = { app };
