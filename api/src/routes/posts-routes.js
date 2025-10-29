const express = require('express');
const { validateBody, validateQuery } = require('../middleware/validate');
const { PostCreate, PostUpdate, ListQuery } = require('../validation/posts-schemas');
const { requireAuth } = require('../middleware/require-auth');

function createPostsRoutes(controller) {
  const router = express.Router();
  router.get('/', validateQuery(ListQuery), controller.list);
  router.post('/', requireAuth, validateBody(PostCreate), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', requireAuth, validateBody(PostCreate), controller.replace);
  router.patch('/:id', requireAuth, validateBody(PostUpdate), controller.update);
  router.delete('/:id', requireAuth, controller.delete);
  return router;
}

module.exports = { createPostsRoutes };


