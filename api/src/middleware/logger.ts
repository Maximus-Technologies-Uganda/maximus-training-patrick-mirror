import type { RequestHandler } from 'express';
import { performance } from 'node:perf_hooks';
import { logInfo } from '../logging/structured';
import { getEffectiveTraceId } from './requestId';

type RequestWithUser = {
  method?: string;
  originalUrl?: string;
  url?: string;
  requestId?: string;
  traceId?: string;
  tracestate?: string;
  user?: { userId?: string; role?: string };
};

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    try {
      const duration = Math.round(performance.now() - start);
      const requestId =
        (res.locals as { requestId?: string }).requestId ||
        (req as RequestWithUser).requestId ||
        (res.getHeader('X-Request-Id') as string | undefined) ||
        undefined;
      const traceId = getEffectiveTraceId(req as RequestWithUser, res);
      const user = (req as RequestWithUser).user || {};
      logInfo('request completed', {
        method: (req.method || '').toUpperCase(),
        path: (req as RequestWithUser).originalUrl || req.url || '',
        status: res.statusCode,
        latency_ms: duration,
        ...(requestId ? { requestId } : {}),
        ...(traceId ? { traceId } : {}),
        ...(user.userId ? { userId: user.userId } : {}),
        ...(user.role ? { role: user.role } : {}),
      });
    } catch {
      // logging should never throw
    }
  });
  next();
};

export default requestLogger;
