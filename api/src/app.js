const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/error-handler');
const { createRateLimiter } = require('./middleware/rate-limit');
const { createPostsController } = require('./controllers/posts-controller');
const { PostsService } = require('./services/posts-service');
const { createPostsRoutes } = require('./routes/posts-routes');
const { createHealthRoutes } = require('./routes/health');

function createApp(config, repository) {
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

  // Error handler
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };


