import express from "express";
import { requireAuth as requireSessionAuth } from "../auth/auth.middleware";
import { setAuthenticatedCacheHeaders } from "../../middleware/cacheHeaders";
import { validateBody, validateQuery } from "../../middleware/validate";
import { ListPostsQuerySchema, PostCreateSchema, PostUpdateSchema } from "./post.schemas";

export function createPostsRoutes(controller: {
  create: (req: unknown, res: unknown, next: unknown) => unknown;
  list: (req: unknown, res: unknown, next: unknown) => unknown;
  getById: (req: unknown, res: unknown, next: unknown) => unknown;
  replace: (req: unknown, res: unknown, next: unknown) => unknown;
  update: (req: unknown, res: unknown, next: unknown) => unknown;
  delete: (req: unknown, res: unknown, next: unknown) => unknown;
}) {
  const router = express.Router();

  // T094: Cache headers middleware must come AFTER auth middleware
  // Order: requireSessionAuth (sets req.user) → setAuthenticatedCacheHeaders (reads req.user)
  router.post("/", requireSessionAuth, setAuthenticatedCacheHeaders, validateBody(PostCreateSchema), controller.create);
  router.get("/", validateQuery(ListPostsQuerySchema), controller.list);
  router.get("/:id", controller.getById);
  router.put("/:id", requireSessionAuth, setAuthenticatedCacheHeaders, validateBody(PostCreateSchema), controller.replace);
  router.patch("/:id", requireSessionAuth, setAuthenticatedCacheHeaders, validateBody(PostUpdateSchema), controller.update);
  router.delete("/:id", requireSessionAuth, setAuthenticatedCacheHeaders, controller.delete);
  return router;
}

export default createPostsRoutes;


