/**
 * contentType.ts
 * Content-Type validation middleware for mutating requests
 *
 * Requirements (T032):
 * - Enforce Content-Type: application/json for POST, PUT, PATCH, DELETE
 * - Accept application/json with charset parameter (e.g., application/json; charset=utf-8)
 * - Return 415 Unsupported Media Type with standardized error envelope
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Validates Content-Type header for mutating HTTP methods
 * Returns 415 if Content-Type is not application/json
 */
export function requireJsonContentType(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Only check mutating methods
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // OPTIONS requests bypass this check (handled by CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  const contentType = req.headers['content-type'];

  // Allow requests without body (e.g., DELETE without payload)
  // Express will handle Content-Length: 0 appropriately
  if (!contentType) {
    const contentLengthHeader = req.headers['content-length'];
    const transferEncodingHeader = req.headers['transfer-encoding'];
    const hasTransferEncoding = typeof transferEncodingHeader === 'string' && transferEncodingHeader.trim().length > 0;
    const contentLength = Array.isArray(contentLengthHeader)
      ? contentLengthHeader[contentLengthHeader.length - 1]
      : contentLengthHeader;
    const hasPositiveContentLength = typeof contentLength === 'string' && Number(contentLength) > 0;

    // If there's no content-type but the request indicates a body, reject
    if (hasPositiveContentLength || hasTransferEncoding || (req.body && Object.keys(req.body).length > 0)) {
      return sendUnsupportedMediaType(req, res, 'Content-Type header is required for requests with body');
    }

    return next();
  }

  const normalizedContentType = contentType.toLowerCase();
  const mediaType = normalizedContentType.split(';')[0]?.trim();
  const isExactJsonMediaType = mediaType === 'application/json';

  if (!isExactJsonMediaType) {
    return sendUnsupportedMediaType(
      req,
      res,
      'Content-Type must be application/json for mutating requests'
    );
  }

  next();
}

/**
 * Send standardized 415 error response
 */
function sendUnsupportedMediaType(req: Request, res: Response, message: string): void {
  const requestId = req.requestId || res.get('X-Request-Id') || res.locals.requestId || 'unknown';

  res.status(415).json({
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message,
    requestId
  });
}
