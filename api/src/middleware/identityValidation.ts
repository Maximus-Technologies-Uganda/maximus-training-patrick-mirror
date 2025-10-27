import type { RequestHandler } from 'express';
import { sendErrorResponse, ERROR_CODES } from '../lib/errors';

/**
 * Validates that identity headers match the authenticated user context (T053)
 *
 * When a user is authenticated (via cookie or bearer token), the BFF should
 * forward the user's identity as X-User-Id and X-User-Role headers. This
 * middleware ensures these headers match the server-resolved identity.
 *
 * If identity headers are present but don't match, the request is rejected
 * with 403 Forbidden. This prevents BFF spoofing attacks and ensures
 * consistency between authentication and identity propagation.
 */
export const validateIdentityHeaders: RequestHandler = (req, res, next) => {
  const authenticatedUser = (req as unknown as { user?: { userId?: string; role?: string } }).user;

  // If no authenticated user, identity headers should not be present
  if (!authenticatedUser) {
    const userIdHeader = req.get('X-User-Id') || req.headers['x-user-id'];
    const userRoleHeader = req.get('X-User-Role') || req.headers['x-user-role'];

    // If identity headers are present without authentication, this is suspicious
    if (userIdHeader || userRoleHeader) {
      return sendErrorResponse(res, ERROR_CODES.FORBIDDEN, 'Identity headers cannot be present without authentication', { request: req });
    }

    return next();
  }

  // If authenticated user exists, enforce identity propagation headers on mutating requests (T053)
  const userIdHeader = req.get('X-User-Id') || req.headers['x-user-id'];
  const userRoleHeader = req.get('X-User-Role') || req.headers['x-user-role'];

  const method = (req.method || '').toUpperCase();
  const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  if (isMutating) {
    if (!userIdHeader || !userRoleHeader) {
      return sendErrorResponse(res, ERROR_CODES.FORBIDDEN, 'Missing identity propagation headers', { request: req });
    }
  }

  // If identity headers are present, they must match the authenticated user
  if (userIdHeader) {
    if (typeof userIdHeader !== 'string') {
      return sendErrorResponse(res, ERROR_CODES.FORBIDDEN, 'X-User-Id header must be a string', { request: req });
    }

    if (userIdHeader !== authenticatedUser.userId) {
      return sendErrorResponse(res, ERROR_CODES.FORBIDDEN, 'Identity header does not match authenticated user', { request: req });
    }
  }

  if (userRoleHeader) {
    if (typeof userRoleHeader !== 'string') {
      return sendErrorResponse(res, ERROR_CODES.FORBIDDEN, 'X-User-Role header must be a string', { request: req });
    }

    const expectedRole = authenticatedUser.role || 'owner';
    if (userRoleHeader !== expectedRole) {
      return sendErrorResponse(res, ERROR_CODES.FORBIDDEN, 'Identity header does not match authenticated user role', { request: req });
    }
  }

  next();
};

export default validateIdentityHeaders;
