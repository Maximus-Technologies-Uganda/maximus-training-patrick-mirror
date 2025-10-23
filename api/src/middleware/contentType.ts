/**
 * contentType.ts
 * Content-Type and Accept header validation middleware for mutating requests
 *
 * Requirements:
 * - T032: Enforce Content-Type: application/json for POST, PUT, PATCH, DELETE → 415
 * - T068: Enforce Accept: application/json for mutating methods → 406
 * - Accept application/json with charset parameter (e.g., application/json; charset=utf-8)
 * - Return standardized error envelopes (415/406)
 *
 * Decision matrix:
 * - Invalid/missing Content-Type when body present → 415 UNSUPPORTED_MEDIA_TYPE
 * - Accept header excludes application/json → 406 NOT_ACCEPTABLE
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
 * T068: Validates Accept header for mutating HTTP methods
 * Returns 406 if Accept header doesn't include application/json
 */
export function requireJsonAccept(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Only check mutating methods
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // OPTIONS requests bypass this check (handled by CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  const acceptHeader = Array.isArray(req.headers['accept'])
    ? req.headers['accept'].join(',')
    : (req.headers['accept'] ?? '');

  // Honor type/subtype wildcards and +json structured syntax suffix
  const acceptsJson = doesAcceptJson(acceptHeader);

  if (!acceptsJson) {
    return sendNotAcceptable(req, res, 'Accept header must include application/json for mutating requests');
  }

  next();
}

/**
 * Send standardized 415 error response
 */
function sendUnsupportedMediaType(req: Request, res: Response, message: string): void {
  const requestId = getRequestId(req, res);

  res.status(415).json({
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message,
    requestId,
    hint: 'Set Content-Type header to application/json for requests with a body'
  });
}

/**
 * Send standardized 406 error response
 */
function sendNotAcceptable(req: Request, res: Response, message: string): void {
  const requestId = getRequestId(req, res);

  res.status(406).json({
    code: 'NOT_ACCEPTABLE',
    message,
    requestId,
    hint: 'Set Accept header to application/json or */* for mutating requests (POST, PUT, PATCH, DELETE)'
  });
}

/**
 * Determines whether the provided Accept header allows application/json responses.
 * - Supports wildcards: any subtype wildcard (e.g., star-slash-star) and application/*
 * - Supports structured syntax suffixes: application/*+json and vendor types ending with +json
 * - Respects q=0 (explicitly unacceptable) on a per-token basis
 */
function doesAcceptJson(acceptHeader: string): boolean {
  const raw = (acceptHeader || '').toLowerCase();
  if (raw.length === 0) return false; // Require explicit Accept per T068

  // Fast path for */*
  if (raw.includes('*/*')) return true;

  const tokens = raw.split(',');
  for (const token of tokens) {
    const part = token.trim();
    if (part.length === 0) continue;

    const [typeSubtype, ...paramParts] = part.split(';').map(s => s.trim());
    if (!typeSubtype.includes('/')) continue;

    const [type, subtype] = typeSubtype.split('/').map(s => s.trim());

    // Parse q value (default 1). If q=0, skip this token as unacceptable
    let q = 1;
    for (const p of paramParts) {
      const [k, v] = p.split('=').map(s => s.trim());
      if (k === 'q' && v) {
        const num = Number(v);
        if (!Number.isNaN(num)) q = num;
      }
    }
    if (q === 0) continue;

    if (type === '*' && subtype === '*') return true;

    if (type === 'application') {
      if (subtype === '*') return true; // application/*
      if (subtype === 'json') return true; // application/json
      if (subtype.endsWith('+json')) return true; // application/*+json or vendor +json
    }
  }

  return false;
}

function getRequestId(req: Request, res: Response): string {
  const reqWithId = (req as unknown as { requestId?: string }).requestId;
  const fromHeader = res.get('X-Request-Id');
  const fromLocals = (res.locals as unknown as { requestId?: string }).requestId;
  return reqWithId || (typeof fromHeader === 'string' ? fromHeader : '') || fromLocals || 'unknown';
}
