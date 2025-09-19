const { makeError } = require('../lib/errors');
const { PostCreate, PostUpdate, ListQuery } = require('../validation/posts-schemas');

function createPostsController(postsService) {
  return {
    async list(req, res, next) {
      try {
        const parsed = ListQuery.safeParse(req.query);
        if (!parsed.success) {
          return next(makeError('validation_error', 'Invalid query parameters', parsed.error.flatten()));
        }
        const { page, pageSize } = parsed.data;
        const result = await postsService.list(page, pageSize);
        res.json({ page, pageSize, hasNextPage: result.hasNextPage, items: result.items });
      } catch (err) { next(err); }
    },
    async create(req, res, next) {
      try {
        const parsed = PostCreate.safeParse(req.body);
        if (!parsed.success) {
          return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()));
        }
        const created = await postsService.create(parsed.data);
        res.status(201).location(`/posts/${created.id}`).json(created);
      } catch (err) { next(err); }
    },
    async getById(req, res, next) {
      try {
        const post = await postsService.getById(req.params.id);
        res.json(post);
      } catch (err) { next(err); }
    },
    async replace(req, res, next) {
      try {
        const parsed = PostCreate.safeParse(req.body);
        if (!parsed.success) {
          return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()));
        }
        const updated = await postsService.replace(req.params.id, parsed.data);
        res.json(updated);
      } catch (err) { next(err); }
    },
    async update(req, res, next) {
      try {
        const parsed = PostUpdate.safeParse(req.body);
        if (!parsed.success) {
          return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()));
        }
        const updated = await postsService.update(req.params.id, parsed.data);
        res.json(updated);
      } catch (err) { next(err); }
    },
    async remove(req, res, next) {
      try {
        await postsService.delete(req.params.id);
        res.status(204).send();
      } catch (err) { next(err); }
    }
  };
}

module.exports = { createPostsController };


