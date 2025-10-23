/**
 * cors.ts
 * Custom CORS middleware with explicit preflight handling
 *
 * Requirements (T031):
 * - OPTIONS preflight returns 204 with proper Access-Control-* headers
 * - Vary header includes Origin, Access-Control-Request-Method, Access-Control-Request-Headers
 * - No rate-limit headers on preflight responses
 * - Access-Control-Max-Age: 600 (10 minutes)
 * - Allowed headers: Authorization, X-CSRF-Token, X-Request-Id, Content-Type
 * - Allowed methods: GET, POST, PUT, PATCH, DELETE
 * - Credentials support when origin is in allowlist
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AppConfig } from '../config';

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

  return (req: Request, res: Response, _next: NextFunction): void => {
    const origin = req.headers.origin;
    const requestMethod = req.headers['access-control-request-method'];
    const requestHeaders = req.headers['access-control-request-headers'];

    // Build Vary header components
    const varyComponents = ['Origin'];
    if (requestMethod) {
      varyComponents.push('Access-Control-Request-Method');
    }
    if (requestHeaders) {
      varyComponents.push('Access-Control-Request-Headers');
    }
    res.setHeader('Vary', varyComponents.join(', '));

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin && allowedOrigins.includes('*')) {
      // Wildcard support (not recommended with credentials)
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
    const currentVary = res.getHeader('Vary');

    if (!currentVary) {
      res.setHeader('Vary', 'Origin');
    } else if (typeof currentVary === 'string') {
      if (!currentVary.includes('Origin')) {
        res.setHeader('Vary', `${currentVary}, Origin`);
      }
    }

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

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin && allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Expose rate-limit headers
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id'
    );

    // Set Vary header
    const currentVary = res.getHeader('Vary');
    if (!currentVary) {
      res.setHeader('Vary', 'Origin');
    } else if (typeof currentVary === 'string' && !currentVary.includes('Origin')) {
      res.setHeader('Vary', `${currentVary}, Origin`);
    }

    next();
  };
}