// Avoid importing Express types here to reduce type resolution friction in tests
import type { ListPostsQuery } from "./post.schemas";
import type { IPostsService } from "../../services/PostsService";
import { NotFoundError } from "../../errors/NotFoundError";

export function createPostsController(postsService: IPostsService) {
  return {
    async create(req, res, next) {
      try {
        const userId = (req as unknown as { user?: { userId?: string } }).user?.userId;
        if (!userId) {
          res.status(401).json({ code: "unauthorized", message: "Unauthorized" });
          return;
        }
        const payload = { ...req.body, ownerId: userId };
        const created = await postsService.create(payload);
        res.status(201).location(`/posts/${created.id}`).json(created);
      } catch (error) {
        next(error);
      }
    },

    async replace(req, res, next) {
      try {
        const userId = (req as unknown as { user?: { userId?: string } }).user?.userId;
        if (!userId) {
          res.status(401).json({ code: "unauthorized", message: "Unauthorized" });
          return;
        }
        let existing;
        try {
          existing = await postsService.getById(req.params.id);
        } catch (err) {
          if (err instanceof NotFoundError) { res.status(404).send(); return; }
          throw err;
        }
        if (existing.ownerId !== userId) {
          res.status(403).json({ code: "forbidden", message: "Forbidden" });
          return;
        }
        const updated = await postsService.replace(req.params.id, req.body);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },

    async list(req, res, next) {
      try {
        const q = (req as typeof req & { validatedQuery?: ListPostsQuery }).validatedQuery ?? req.query;
        const page = typeof q.page === "number" ? q.page : (typeof q.page === "string" ? parseInt(q.page, 10) : 1);
        const pageSize = typeof q.pageSize === "number" ? q.pageSize : (typeof q.pageSize === "string" ? parseInt(q.pageSize, 10) : 10);
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1;
        const safePageSize = Number.isFinite(pageSize) && pageSize >= 1 ? pageSize : 10;
        const result = await postsService.list({ page: safePage, pageSize: safePageSize });
        res.status(200).json({
          items: result.items,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          page: result.currentPage,
          hasNextPage: result.hasNextPage,
          pageSize: result.pageSize,
        });
      } catch (error) {
        next(error);
      }
    },

    async getById(req, res, next) {
      try {
        const post = await postsService.getById(req.params.id);
        res.json(post);
      } catch (error) {
        if (error instanceof NotFoundError) { res.status(404).send(); return; }
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const userId = (req as unknown as { user?: { userId?: string } }).user?.userId;
        if (!userId) {
          res.status(401).json({ code: "unauthorized", message: "Unauthorized" });
          return;
        }
        let existing;
        try {
          existing = await postsService.getById(req.params.id);
        } catch (err) {
          if (err instanceof NotFoundError) { res.status(404).send(); return; }
          throw err;
        }
        if (existing.ownerId !== userId) {
          res.status(403).json({ code: "forbidden", message: "Forbidden" });
          return;
        }
        const updated = await postsService.update(req.params.id, req.body);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },

    async delete(req, res, next) {
      try {
        const userId = (req as unknown as { user?: { userId?: string } }).user?.userId;
        if (!userId) {
          res.status(401).json({ code: "unauthorized", message: "Unauthorized" });
          return;
        }
        let existing;
        try {
          existing = await postsService.getById(req.params.id);
        } catch (err) {
          if (err instanceof NotFoundError) { res.status(404).send(); return; }
          throw err;
        }
        if (existing.ownerId !== userId) {
          res.status(403).json({ code: "forbidden", message: "Forbidden" });
          return;
        }
        await postsService.delete(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}


