// Avoid importing Express types here to reduce type resolution friction in tests
import type { ListPostsQuery } from "./post.schemas";
import type { IPostsService } from "../../services/PostsService";
import { sendErrorResponse, ERROR_CODES } from "../../lib/errors";
import { NotFoundError } from "../../errors/NotFoundError";
import { auditPost } from "../../logging/audit";

type RequestUser = { userId?: string; role?: string };

function resolveRequestUser(req: unknown): RequestUser {
  const maybeUser = (req as { user?: { userId?: unknown; role?: unknown } }).user;
  if (!maybeUser || typeof maybeUser !== "object") {
    return {};
  }
  const userId = typeof maybeUser.userId === "string" && maybeUser.userId.trim().length > 0
    ? maybeUser.userId.trim()
    : undefined;
  const role = typeof maybeUser.role === "string" && maybeUser.role.trim().length > 0 ? maybeUser.role.trim() : undefined;
  return { userId, role };
}

function respondUnauthorized(req: unknown, res: unknown): void {
  sendErrorResponse(res as never, ERROR_CODES.UNAUTHORIZED, "Invalid or expired authentication token", {
    request: req as never,
  });
}

function respondForbidden(req: unknown, res: unknown): void {
  sendErrorResponse(res as never, ERROR_CODES.FORBIDDEN, "Insufficient permissions to access this resource", {
    request: req as never,
  });
}

export function createPostsController(postsService: IPostsService) {
  type ServicePost = Awaited<ReturnType<IPostsService["getById"]>>;
  return {
    async create(req, res, next) {
      try {
        const { userId } = resolveRequestUser(req);
        if (!userId) {
          respondUnauthorized(req, res);
          return;
        }
        const { title, content, tags, published } = req.body;
        const created = await postsService.create({ title, content, tags, published, ownerId: userId });
        res.status(201).location(`/posts/${created.id}`).json(created);
        auditPost(req as never, "create", created.id, 201);
      } catch (error) {
        next(error);
      }
    },

    async replace(req, res, next) {
      try {
        const { userId, role } = resolveRequestUser(req);
        const userRole = role ?? "owner";
        if (!userId) {
          respondUnauthorized(req, res);
          return;
        }
        const ownerIdInjection = Boolean(((res.locals as unknown as { identityStripped?: { ownerId?: boolean } }).identityStripped)?.ownerId);
        let existing: ServicePost | null = null;
        try {
          existing = await postsService.getById(req.params.id);
        } catch (err) {
          if (err instanceof NotFoundError) {
            if (ownerIdInjection) {
              return sendErrorResponse(res as never, ERROR_CODES.VALIDATION_ERROR, "Request validation failed", { request: req as never });
            }
            res.status(404).send();
            return;
          }
          throw err;
        }
        if (!existing) {
          if (ownerIdInjection) {
            return sendErrorResponse(res as never, ERROR_CODES.VALIDATION_ERROR, "Request validation failed", { request: req as never });
          }
          res.status(404).send();
          return;
        }
        // Check authorization: admin can mutate any post, owner can only mutate their own
        const isAuthorized = userRole === "admin" || (existing.ownerId && existing.ownerId === userId);
        if (!isAuthorized) {
          auditPost(req as never, "update", req.params.id, 403, {
            outcome: "denied",
            denialReason: "insufficient-permissions",
          });
          respondForbidden(req, res);
          return;
        }
        const updated = await postsService.replace(req.params.id, req.body);
        res.json(updated);
        auditPost(req as never, "update", req.params.id, 200);
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
        if (!post) {
          res.status(404).send();
          return;
        }
        res.json(post);
      } catch (error) {
        if (error instanceof NotFoundError) { res.status(404).send(); return; }
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const { userId, role } = resolveRequestUser(req);
        const userRole = role ?? "owner";
        if (!userId) {
          respondUnauthorized(req, res);
          return;
        }
        const ownerIdInjection = Boolean(((res.locals as unknown as { identityStripped?: { ownerId?: boolean } }).identityStripped)?.ownerId);
        let existing: ServicePost | null = null;
        try {
          existing = await postsService.getById(req.params.id);
        } catch (err) {
          if (err instanceof NotFoundError) {
            if (ownerIdInjection) {
              return sendErrorResponse(res as never, ERROR_CODES.VALIDATION_ERROR, "Request validation failed", { request: req as never });
            }
            res.status(404).send();
            return;
          }
          throw err;
        }
        if (!existing) {
          if (ownerIdInjection) {
            return sendErrorResponse(res as never, ERROR_CODES.VALIDATION_ERROR, "Request validation failed", { request: req as never });
          }
          res.status(404).send();
          return;
        }
        // Check authorization: admin can mutate any post, owner can only mutate their own
        const isAuthorized = userRole === "admin" || (existing.ownerId && existing.ownerId === userId);
        if (!isAuthorized) {
          auditPost(req as never, "update", req.params.id, 403, {
            outcome: "denied",
            denialReason: "insufficient-permissions",
          });
          respondForbidden(req, res);
          return;
        }
        const updated = await postsService.update(req.params.id, req.body);
        res.json(updated);
        auditPost(req as never, "update", req.params.id, 200);
      } catch (error) {
        next(error);
      }
    },

    async delete(req, res, next) {
      try {
        const { userId, role } = resolveRequestUser(req);
        const userRole = role ?? "owner";
        if (!userId) {
          respondUnauthorized(req, res);
          return;
        }
        let existing: ServicePost | null = null;
        try {
          existing = await postsService.getById(req.params.id);
        } catch (err) {
          if (err instanceof NotFoundError) { res.status(404).send(); return; }
          throw err;
        }
        if (!existing) {
          res.status(404).send();
          return;
        }
        // Check authorization: admin can mutate any post, owner can only mutate their own
        const isAuthorized = userRole === "admin" || (existing.ownerId && existing.ownerId === userId);
        if (!isAuthorized) {
          auditPost(req as never, "delete", req.params.id, 403, {
            outcome: "denied",
            denialReason: "insufficient-permissions",
          });
          respondForbidden(req, res);
          return;
        }
        await postsService.delete(req.params.id);
        res.status(204).send();
        auditPost(req as never, "delete", req.params.id, 204);
      } catch (error) {
        next(error);
      }
    },
  };
}
