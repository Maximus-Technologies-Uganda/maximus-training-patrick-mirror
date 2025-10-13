 

function createPostsController(postsService) {
  return {
    async list(req, res, next) {
      try {
        const { page, pageSize } = req.validatedQuery || req.query;
        const result = await postsService.list(page, pageSize);
        res.json({ page, pageSize, hasNextPage: result.hasNextPage, items: result.items });
      } catch (err) { next(err); }
    },
    async create(req, res, next) {
      try {
        const userId = req.user && req.user.userId;
        if (!userId) { res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' }); return; }
        const payload = { ...req.body, ownerId: userId };
        const created = await postsService.create(payload);
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
        const userId = req.user && req.user.userId;
        if (!userId) { res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' }); return; }
        const existing = await postsService.getById(req.params.id);
        if (!existing) { res.status(404).send(); return; }
        if (existing.ownerId !== userId) { res.status(403).json({ code: 'forbidden', message: 'Forbidden' }); return; }
        const updated = await postsService.replace(req.params.id, req.body);
        res.json(updated);
      } catch (err) { next(err); }
    },
    async update(req, res, next) {
      try {
        const userId = req.user && req.user.userId;
        if (!userId) { res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' }); return; }
        const existing = await postsService.getById(req.params.id);
        if (!existing) { res.status(404).send(); return; }
        if (existing.ownerId !== userId) { res.status(403).json({ code: 'forbidden', message: 'Forbidden' }); return; }
        const updated = await postsService.update(req.params.id, req.body);
        res.json(updated);
      } catch (err) { next(err); }
    },
    async remove(req, res, next) {
      try {
        const userId = req.user && req.user.userId;
        if (!userId) { res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' }); return; }
        const existing = await postsService.getById(req.params.id);
        if (!existing) { res.status(404).send(); return; }
        if (existing.ownerId !== userId) { res.status(403).json({ code: 'forbidden', message: 'Forbidden' }); return; }
        await postsService.delete(req.params.id);
        res.status(204).send();
      } catch (err) { next(err); }
    }
  };
}

module.exports = { createPostsController };


