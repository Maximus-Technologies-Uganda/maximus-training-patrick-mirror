const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/error-handler');
const { createRateLimiter } = require('./middleware/rate-limit');
const { notFoundHandler } = require('./middleware/not-found');
const { createPostsController } = require('./controllers/posts-controller');
const { PostsService } = require('./services/posts-service');
const { createPostsRoutes } = require('./routes/posts-routes');
const { createHealthRoutes } = require('./routes/health');

function createApp(config, repository) {
  const app = express();
  app.use(helmet());
  // Configure CORS to support credentialed cookie auth
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(morgan('combined'));
  app.use(createRateLimiter(config));

  // Health
  app.use('/', createHealthRoutes());

  // Auth
  const { createAuthRoutes } = require('./routes/auth');
  app.use('/auth', createAuthRoutes());

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

  // 404 handler for unmatched routes
  app.use(notFoundHandler);
  // Error handler
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };


