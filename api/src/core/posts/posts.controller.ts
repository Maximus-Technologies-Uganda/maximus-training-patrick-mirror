import type { RequestHandler } from "express";
import { PostsService } from "./posts.service";

const postsService = new PostsService();

export const postsController: {
  create: RequestHandler;
  list: RequestHandler;
  getById: RequestHandler;
  update: RequestHandler;
  delete: RequestHandler;
} = {
  async create(req, res, next) {
    try {
      const created = await postsService.create(req.body);
      res.status(201).location(`/posts/${created.id}`).json(created);
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const q = (req as any).validatedQuery ?? req.query;
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
      if (!post) {
        res.status(404).send();
        return;
      }
      res.json(post);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await postsService.update(req.params.id, req.body);
      if (!updated) {
        res.status(404).send();
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const removed = await postsService.delete(req.params.id);
      if (!removed) {
        res.status(404).send();
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};


