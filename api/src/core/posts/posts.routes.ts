import express from "express";
import { requireAuth as requireSessionAuth } from "../auth/auth.middleware";
import { setAuthenticatedCacheHeaders } from "../../middleware/cacheHeaders";
import { validateBody, validateQuery } from "../../middleware/validate";
import { ListPostsQuerySchema, PostCreateSchema, PostUpdateSchema } from "./post.schemas";
import { requireCsrf } from "../../middleware/csrf";
import { validateIdentityHeaders } from "../../middleware/identityValidation";
import { enforceAdminRevocation } from "../../middleware/auth";

export function createPostsRoutes(controller: {
  create: (req: unknown, res: unknown, next: unknown) => unknown;
  list: (req: unknown, res: unknown, next: unknown) => unknown;
  getById: (req: unknown, res: unknown, next: unknown) => unknown;
  replace: (req: unknown, res: unknown, next: unknown) => unknown;
  update: (req: unknown, res: unknown, next: unknown) => unknown;
  delete: (req: unknown, res: unknown, next: unknown) => unknown;
}, deps: { rateLimiterRead: express.RequestHandler; rateLimiterWrite: express.RequestHandler }) {
  const { rateLimiterRead, rateLimiterWrite } = deps;
  const router = express.Router();

  // T094 + T064: Middleware ordering for performance and security
  // Order: requireSessionAuth (cheap JWT) → validateIdentityHeaders → rateLimiterWrite → requireCsrf (cheap HMAC)
  //        → enforceAdminRevocation (expensive Firebase call) → setAuthenticatedCacheHeaders → validateBody → controller
  // FIX (Gap #2): Perform cheap validations (rate limit, CSRF) before expensive Firebase revocation check
  router.post(
    "/",
    requireSessionAuth,
    validateIdentityHeaders,
    rateLimiterWrite,
    requireCsrf,
    enforceAdminRevocation,
    setAuthenticatedCacheHeaders,
    validateBody(PostCreateSchema),
    controller.create,
  );
  router.get("/", rateLimiterRead, validateQuery(ListPostsQuerySchema), controller.list);
  router.get("/:id", rateLimiterRead, controller.getById);
  router.put(
    "/:id",
    requireSessionAuth,
    validateIdentityHeaders,
    rateLimiterWrite,
    requireCsrf,
    enforceAdminRevocation,
    setAuthenticatedCacheHeaders,
    validateBody(PostCreateSchema),
    controller.replace,
  );
  router.patch(
    "/:id",
    requireSessionAuth,
    validateIdentityHeaders,
    rateLimiterWrite,
    requireCsrf,
    enforceAdminRevocation,
    setAuthenticatedCacheHeaders,
    validateBody(PostUpdateSchema),
    controller.update,
  );
  router.delete(
    "/:id",
    requireSessionAuth,
    validateIdentityHeaders,
    rateLimiterWrite,
    requireCsrf,
    enforceAdminRevocation,
    setAuthenticatedCacheHeaders,
    controller.delete,
  );
  return router;
}

export default createPostsRoutes;


