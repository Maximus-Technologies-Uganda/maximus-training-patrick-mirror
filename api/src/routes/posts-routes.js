const express = require('express');
const { validateBody, validateQuery } = require('../middleware/validate');
const { PostCreate, PostUpdate, ListQuery } = require('../validation/posts-schemas');

function createPostsRoutes(controller) {
  const router = express.Router();
  router.get('/', validateQuery(ListQuery), controller.list);
  router.post('/', validateBody(PostCreate), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', validateBody(PostCreate), controller.replace);
  router.patch('/:id', validateBody(PostUpdate), controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

module.exports = { createPostsRoutes };


