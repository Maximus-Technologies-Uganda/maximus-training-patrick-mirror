import type { Request, Response, NextFunction } from 'express';
import { setCacheControlNoStore } from '../lib/errors';

/**
 * Error handler for JSON parsing errors including payload size limits (T047)
 * Converts Express JSON parsing errors to standardized 413 response envelope
 * Must be used as an error handler after express.json()
 */
export function jsonBodyLimitHandler(_config: { jsonLimit: string }) {
  return (err: Error | undefined, req: Request, res: Response, next: NextFunction) => {
    // Check for payload too large error (Express throws this when JSON limit is exceeded)
    if (
      err &&
      (err.message?.includes('request entity too large') ||
        (err as any).code === 'PAYLOAD_TOO_LARGE' ||
        (err as any).type === 'entity.too.large' ||
        (err instanceof SyntaxError && err.message.includes('Unexpected end of JSON input')))
    ) {
      setCacheControlNoStore(res, 413);
      const requestId =
        (req as unknown as { requestId?: string }).requestId ||
        ((req.get('X-Request-Id') || req.headers['x-request-id']) as string | undefined);

      // Return standardized JSON envelope for 413 (T047)
      return res.status(413).json({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds 1MB limit',
        ...(requestId ? { requestId } : {}),
      });
    }

    next(err);
  };
}
