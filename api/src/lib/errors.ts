import type { Request, Response } from 'express';

// Standard error envelope interface matching OpenAPI specification
export interface ErrorEnvelope {
  code: string;
  message: string;
  requestId?: string;
  traceId?: string;
  details?: unknown;
}

export interface ValidationErrorEnvelope extends ErrorEnvelope {
  details: Array<{
    path: string;
    issue: string;
  }>;
}

/**
 * Standard error codes as defined in OpenAPI specification
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  NOT_ACCEPTABLE: 'NOT_ACCEPTABLE',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * HTTP status codes mapping for error codes
 */
export const STATUS_BY_CODE: Record<string, number> = {
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.RATE_LIMITED]: 429,
  [ERROR_CODES.PAYLOAD_TOO_LARGE]: 413,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.UNSUPPORTED_MEDIA_TYPE]: 415,
  [ERROR_CODES.NOT_ACCEPTABLE]: 406,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  // Backward compatibility aliases (lowercase codes used by legacy middleware/tests)
  validation_error: 422,
  not_found: 404,
  rate_limit_exceeded: 429,
  payload_too_large: 413,
  service_unavailable: 503,
  unauthorized: 401,
  forbidden: 403,
};

/**
 * Creates a standardized error envelope
 */
export function createErrorEnvelope(
  code: string,
  message: string,
  options: {
    request?: Request;
    response?: Response;
    details?: unknown;
    traceId?: string;
  } = {}
): ErrorEnvelope {
  const { request, response, details, traceId } = options;

  // Extract request ID from request headers or response headers
  let requestId: string | undefined;
  if (request) {
    const reqAny = request as unknown as { requestId?: string; headers?: Record<string, unknown>; get?: (name: string) => string | undefined };
    const getReq = typeof reqAny?.get === 'function' ? reqAny.get.bind(request) : null;
    const getReqHeader = (name: string): string | undefined => {
      const headers = reqAny?.headers as Record<string, unknown> | undefined;
      const lower = name.toLowerCase();
      const fromHeaders = headers && (headers[lower] as string | undefined);
      const fromGetter = getReq ? getReq(name) : undefined;
      return fromGetter || fromHeaders || undefined;
    };
    requestId = reqAny.requestId || getReqHeader('X-Request-Id') || getReqHeader('x-request-id');
  }
  if (!requestId && response) {
    const resAny = response as unknown as { get?: (name: string) => string | undefined };
    const resGet = typeof resAny?.get === 'function' ? resAny.get.bind(response) : null;
    if (resGet) {
      requestId = resGet('X-Request-Id') || resGet('x-request-id');
    }
  }

  // Extract trace ID from request traceparent header if not provided
  let effectiveTraceId = traceId;
  if (!effectiveTraceId && request) {
    const traceparent = request.get('traceparent');
    if (typeof traceparent === 'string') {
      const parts = traceparent.split('-');
      if (parts.length >= 4 && parts[1] && /^[0-9a-f]{32}$/i.test(parts[1])) {
        effectiveTraceId = parts[1];
      }
    }
  }

  const envelope: ErrorEnvelope = {
    code,
    message,
  };

  if (requestId) {
    envelope.requestId = requestId;
  }

  if (effectiveTraceId) {
    envelope.traceId = effectiveTraceId;
  }

  if (details !== undefined) {
    envelope.details = details;
  }

  return envelope;
}

/**
 * Creates a validation error envelope with structured details
 */
export function createValidationErrorEnvelope(
  message: string,
  validationDetails: Array<{ path: string; issue: string }>,
  options: {
    request?: Request;
    response?: Response;
    traceId?: string;
  } = {}
): ValidationErrorEnvelope {
  return {
    ...createErrorEnvelope(ERROR_CODES.VALIDATION_ERROR, message, options),
    details: validationDetails,
  } as ValidationErrorEnvelope;
}

/**
 * Creates an error response and sends it immediately
 */
export function sendErrorResponse(
  response: Response,
  code: string,
  message: string,
  options: {
    request?: Request;
    details?: unknown;
    traceId?: string;
    statusCode?: number;
  } = {}
): void {
  const { request, details, traceId, statusCode } = options;

  const envelope = createErrorEnvelope(code, message, {
    request,
    response,
    details,
    traceId,
  });

  const status = statusCode || STATUS_BY_CODE[code] || 500;

  // Set cache control headers for error responses (T087)
  try {
    setCacheControlNoStore(response, status);
  } catch {
    // ignore if response object doesn't support headers in test doubles
  }

  response.status(status).json(envelope);
}

/**
 * Creates a custom domain error class that integrates with the error envelope system
 */
export class StandardError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly statusCode?: number;

  constructor(
    code: string,
    message: string,
    details?: unknown,
    statusCode?: number
  ) {
    super(message || code);
    this.name = 'StandardError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }

  /**
   * Converts this error to a standardized envelope
   */
  toEnvelope(request?: Request, response?: Response, traceId?: string): ErrorEnvelope {
    return createErrorEnvelope(this.code, this.message, {
      request,
      response,
      details: this.details,
      traceId,
    });
  }

  /**
   * Sends this error as a response
   */
  sendResponse(response: Response, request?: Request, traceId?: string): void {
    const envelope = this.toEnvelope(request, response, traceId);
    const status = this.statusCode || STATUS_BY_CODE[this.code] || 500;

    // Set cache control headers for error responses (T087)
    response.setHeader('Cache-Control', 'no-store');

    response.status(status).json(envelope);
  }
}

/**
 * Error classes for common HTTP errors
 */
export class UnauthorizedError extends StandardError {
  constructor(message = 'Invalid or expired authentication token', details?: unknown) {
    super(ERROR_CODES.UNAUTHORIZED, message, details, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends StandardError {
  constructor(message = 'Insufficient permissions to access this resource', details?: unknown) {
    super(ERROR_CODES.FORBIDDEN, message, details, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends StandardError {
  constructor(message = 'Request validation failed', details?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, details, 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends StandardError {
  constructor(message = 'Rate limit exceeded. Please try again later.', details?: unknown) {
    super(ERROR_CODES.RATE_LIMITED, message, details, 429);
    this.name = 'RateLimitError';
  }
}

export class PayloadTooLargeError extends StandardError {
  constructor(message = 'Request payload exceeds 1MB limit', details?: unknown) {
    super(ERROR_CODES.PAYLOAD_TOO_LARGE, message, details, 413);
    this.name = 'PayloadTooLargeError';
  }
}

export class ServiceUnavailableError extends StandardError {
  constructor(message = 'Service is in read-only mode', details?: unknown) {
    super(ERROR_CODES.SERVICE_UNAVAILABLE, message, details, 503);
    this.name = 'ServiceUnavailableError';
  }
}

// Backward compatibility exports for existing code
export const statusByCode = STATUS_BY_CODE;
export const NO_STORE_STATUSES = new Set([401, 403, 413, 415, 422, 429, 503]);

export function setCacheControlNoStore(response: any, status?: number): void {
  if (!response || typeof response.setHeader !== 'function') return;
  if (status !== undefined && !NO_STORE_STATUSES.has(status)) return;
  response.setHeader('Cache-Control', 'no-store');
}

export function shouldPreventCache(status: number): boolean {
  return Number.isFinite(status) && NO_STORE_STATUSES.has(status);
}

export function makeError(code: string, message: string, details?: unknown): Error {
  const err = new Error(message || code);
  (err as any).code = code;
  if (details !== undefined) {
    (err as any).details = details;
  }
  return err;
}
