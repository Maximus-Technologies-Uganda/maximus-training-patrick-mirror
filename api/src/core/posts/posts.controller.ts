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
      const page = typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
      const pageSize = typeof req.query.pageSize === "string" ? parseInt(req.query.pageSize, 10) : 10;
      const items = await postsService.list({ page: Number.isNaN(page) ? 1 : page, pageSize: Number.isNaN(pageSize) ? 10 : pageSize });
      res.json(items);
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


