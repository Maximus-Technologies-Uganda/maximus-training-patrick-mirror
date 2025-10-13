// Use CommonJS-compatible require to avoid TS type resolution issues in tests
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require("express");
import { requireAuth as requireSessionAuth } from "../auth/auth.middleware";
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
  router.post("/", requireSessionAuth, validateBody(PostCreateSchema), controller.create);
  router.get("/", validateQuery(ListPostsQuerySchema), controller.list);
  router.get("/:id", controller.getById);
  router.put("/:id", requireSessionAuth, validateBody(PostCreateSchema), controller.replace);
  router.patch("/:id", requireSessionAuth, validateBody(PostUpdateSchema), controller.update);
  router.delete("/:id", requireSessionAuth, controller.delete);
  return router;
}

export default createPostsRoutes;


