import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, sendErrorResponse } from "../lib/errors";

/**
 * T104: Strip client-supplied identity fields from request bodies
 * to prevent privilege escalation or spoofing. Server determines identity.
 */
export function stripIdentityFields(req: Request, res: Response, next: NextFunction): void {
  const mutating = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE';
  if (!mutating) return next();

  const body = req.body as unknown;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    // T099: Reject attempts to inject ownership on create; strip on updates
    if (Object.prototype.hasOwnProperty.call(obj, 'ownerId')) {
      try {
        const locals = (res as unknown as { locals?: Record<string, unknown> }).locals || {};
        const identityStripped = (locals.identityStripped as Record<string, unknown> | undefined) || {};
        identityStripped.ownerId = true;
        (res as unknown as { locals: Record<string, unknown> }).locals = { ...locals, identityStripped };
      } catch {
        // ignore if res.locals is not writable in tests
      }
      const method = (req.method || '').toUpperCase();
      if (method === 'POST') {
        return sendErrorResponse(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          'Request validation failed',
          {
            request: req,
            details: [
              { path: 'ownerId', issue: 'ownerId is not allowed in request body' },
            ],
          }
        );
      }
      delete obj.ownerId;
    }

    // Continue stripping other privileged identity fields to prevent spoofing
    delete obj.userId;
    delete obj.role;
    delete obj.authorId;
  }
  next();
}

export default stripIdentityFields;
