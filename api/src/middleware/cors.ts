/**
 * cors.ts
 * Custom CORS middleware with explicit preflight handling
 *
 * Requirements:
 * - T031: OPTIONS preflight returns 204 with proper Access-Control-* headers
 * - T061: Expose rate-limit headers to browsers via Access-Control-Expose-Headers
 * - T069: Reject Origin: null (unless dev flag); no wildcard (*) in production
 * - Vary header includes Origin, Access-Control-Request-Method, Access-Control-Request-Headers
 * - No rate-limit headers on preflight responses
 * - Access-Control-Max-Age: 600 (10 minutes)
 * - Allowed headers: Authorization, X-CSRF-Token, X-Request-Id, Content-Type
 * - Allowed methods: GET, POST, PUT, PATCH, DELETE
 * - Credentials support when origin is in allowlist
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AppConfig } from '../config';
import { setCacheControlNoStore } from '../lib/errors';

function ensureVaryIncludes(res: Response, token: string): void {
  const current = res.getHeader('Vary');
  if (!current) {
    res.setHeader('Vary', token);
    return;
  }

  const values = Array.isArray(current)
    ? current.flatMap((value) => String(value).split(','))
    : String(current).split(',');

  const normalized = values.map((value) => value.trim()).filter(Boolean);
  const hasToken = normalized.some((value) => value.toLowerCase() === token.toLowerCase());

  if (!hasToken) {
    normalized.push(token);
    res.setHeader('Vary', normalized.join(', '));
  }
}

/**
 * CORS preflight handler (OPTIONS requests)
 * Returns 204 with Access-Control-* headers
 * Bypasses rate limiting and other middleware
 */
export function corsPreflight(_config: AppConfig): RequestHandler {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === 'production';
  const allowNullOrigin = process.env.ALLOW_NULL_ORIGIN === 'true'; // dev only

  return (req: Request, res: Response, _next: NextFunction): void => {
    const origin = req.headers.origin;
    const requestMethod = req.headers['access-control-request-method'];
    const requestHeaders = req.headers['access-control-request-headers'];

    // Build Vary header components
    ensureVaryIncludes(res, 'Origin');
    if (requestMethod) {
      ensureVaryIncludes(res, 'Access-Control-Request-Method');
    }
    if (requestHeaders) {
      ensureVaryIncludes(res, 'Access-Control-Request-Headers');
    }

    // T069: Reject Origin: null unless explicitly allowed (dev only)
    if (origin === 'null' && !allowNullOrigin) {
      const requestId = res.locals.requestId || req.requestId || 'unknown';

      setCacheControlNoStore(res, 403);
      res.status(403).json({
        code: 'FORBIDDEN_NULL_ORIGIN',
        message: 'Origin: null is not allowed',
        requestId,
        hint: 'Requests from local files or sandboxed contexts are blocked. Use a proper origin or set ALLOW_NULL_ORIGIN=true in development.'
      });
      return;
    }

    // T069: Never allow wildcard in production
    if (isProd && allowedOrigins.includes('*')) {
      const requestId = res.locals.requestId || req.requestId || 'unknown';

      console.error(JSON.stringify({
        level: 'error',
        message: 'SECURITY ERROR: Wildcard CORS origin (*) detected in production',
        context: 'cors-preflight',
        env: process.env.NODE_ENV,
        configuredOrigins: allowedOrigins,
        requestId
      }));
      setCacheControlNoStore(res, 500);
      res.status(500).json({
        code: 'INVALID_CORS_CONFIG',
        message: 'Internal server error',
        requestId,
        hint: 'Wildcard CORS origin (*) is not allowed in production. Configure specific allowed origins via CORS_ORIGINS environment variable.'
      });
      return;
    }

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin && allowedOrigins.includes('*') && !isProd) {
      // Wildcard support (only in dev/test)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Set allowed methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');

    // Set allowed headers (all headers we accept)
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, X-CSRF-Token, X-Request-Id, Content-Type'
    );

    // Set max age for preflight cache (10 minutes)
    res.setHeader('Access-Control-Max-Age', '600');

    // Expose headers to the browser (for non-preflight responses, but set here for completeness)
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id'
    );

    // Return 204 No Content (standard for successful preflight)
    // Do NOT call next() - we're done with this request
    res.status(204).end();
  };
}

/**
 * Add Vary: Origin header to normal responses
 * This ensures caches understand the response varies by Origin
 */
export function corsVaryHeader(): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    ensureVaryIncludes(res, 'Origin');
    next();
  };
}

/**
 * Set CORS headers for normal (non-preflight) requests
 * Used in conjunction with the cors() package for simple requests
 */
export function corsHeaders(_config: AppConfig): RequestHandler {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === 'production';
  const allowNullOrigin = process.env.ALLOW_NULL_ORIGIN === 'true'; // dev only

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    // T069: Reject Origin: null unless explicitly allowed (dev only)
    if (origin === 'null' && !allowNullOrigin) {
      const requestId = res.locals.requestId || req.requestId || 'unknown';

      setCacheControlNoStore(res, 403);
      res.status(403).json({
        code: 'FORBIDDEN_NULL_ORIGIN',
        message: 'Origin: null is not allowed',
        requestId,
        hint: 'Requests from local files or sandboxed contexts are blocked. Use a proper origin or set ALLOW_NULL_ORIGIN=true in development.'
      });
      return;
    }

    // T069: Never allow wildcard in production
    if (isProd && allowedOrigins.includes('*')) {
      const requestId = res.locals.requestId || req.requestId || 'unknown';

      console.error(JSON.stringify({
        level: 'error',
        message: 'SECURITY ERROR: Wildcard CORS origin (*) detected in production',
        context: 'cors-headers',
        env: process.env.NODE_ENV,
        configuredOrigins: allowedOrigins,
        requestId
      }));
      setCacheControlNoStore(res, 500);
      res.status(500).json({
        code: 'INVALID_CORS_CONFIG',
        message: 'Internal server error',
        requestId,
        hint: 'Wildcard CORS origin (*) is not allowed in production. Configure specific allowed origins via CORS_ORIGINS environment variable.'
      });
      return;
    }

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin && allowedOrigins.includes('*') && !isProd) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Expose rate-limit headers (T061)
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id'
    );

    // Set Vary header
    ensureVaryIncludes(res, 'Origin');

    next();
  };
}
