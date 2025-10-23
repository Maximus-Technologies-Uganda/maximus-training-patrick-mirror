import type { Request, Response, NextFunction } from "express";

/**
 * T104: Strip client-supplied identity fields from request bodies
 * to prevent privilege escalation or spoofing. Server determines identity.
 */
export function stripIdentityFields(req: Request, _res: Response, next: NextFunction): void {
  const mutating = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE';
  if (!mutating) return next();

  const body = req.body as unknown;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    delete obj.userId;
    delete obj.role;
    delete obj.authorId;
  }
  next();
}

export default stripIdentityFields;

