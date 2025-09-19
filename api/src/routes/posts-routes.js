const express = require('express');

function createPostsRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.replace);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

module.exports = { createPostsRoutes };


