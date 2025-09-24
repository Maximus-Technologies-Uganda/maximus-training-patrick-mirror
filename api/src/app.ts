// App factory for the TypeScript entrypoint, wiring middleware, routes, and error handling
// We intentionally use CommonJS-style requires to avoid ESM/CJS interop pitfalls in ts-jest

export function createApp(config: any, repository: any) {
  const express = require('express');
  const helmet = require('helmet');
  const cors = require('cors');
  const morgan = require('morgan');

  const { errorHandler } = require('./middleware/error-handler');
  const { createRateLimiter } = require('./middleware/rate-limit');

  // Posts stack from the JS implementation (stable, covered by tests)
  const { createPostsController } = require('./controllers/posts-controller');
  const { PostsService } = require('./services/posts-service');
  const { createPostsRoutes } = require('./routes/posts-routes');
  const { createHealthRoutes } = require('./routes/health');

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(morgan('combined'));
  app.use(createRateLimiter(config));

  // Health
  app.use('/', createHealthRoutes());

  // Posts
  const postsService = new PostsService(repository);
  const postsController = createPostsController(postsService);
  app.use('/posts', createPostsRoutes(postsController));

  // In development, expose the OpenAPI spec directly from the repo as the source of truth
  if (process.env.NODE_ENV !== 'production') {
    const path = require('path');
    const specPath = path.join(__dirname, '..', 'openapi.json');
    app.get('/openapi.json', (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.type('application/json');
      res.sendFile(specPath);
    });
  }

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default undefined as unknown as never;


