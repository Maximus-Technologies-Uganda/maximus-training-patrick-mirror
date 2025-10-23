import type { Request, Response, NextFunction } from "express";

/**
 * T094: Set strict cache headers for authenticated routes.
 *
 * CRITICAL ORDERING CONSTRAINT:
 * This middleware MUST be placed after authentication middleware in the Express stack.
 * It relies on req.user being set by the auth middleware to determine if the request
 * is authenticated.
 *
 * Recommended placement:
 *   app.use(authMiddleware);        // Sets req.user
 *   app.use(setAuthenticatedCacheHeaders); // Reads req.user
 *
 * If auth middleware is moved or removed, this middleware will silently fail to
 * set cache headers, potentially leaking authenticated responses to caches.
 *
 * @see api/src/app.ts for current middleware ordering
 */
export function setAuthenticatedCacheHeaders(req: Request, res: Response, next: NextFunction): void {
  const user = (req as unknown as { user?: unknown }).user;
  if (user) {
    res.setHeader('Cache-Control', 'no-store, private');
  }
  next();
}

export default setAuthenticatedCacheHeaders;

