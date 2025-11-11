import { v4 as uuidv4 } from "uuid";

/**
 * Trace logging middleware
 * - Generates x-trace-id per request for correlation
 * - Measures latency and captures required log fields
 * - Provides structured logging with sensitive field redaction
 * FR-013: Trace ID generation and propagation
 * FR-020: Log fields (trace, route, latency_ms, status, upstream_status)
 * FR-028: 100% sampling for ok:false /status events
 */

export interface TraceLogEntry {
  trace: string;
  route: string;
  latency_ms: number;
  status: number;
  upstream_status?: number;
  method: string;
  timestamp: string;
  reason?: string;
  ok: boolean;
}

/**
 * Redaction guard: strip sensitive headers/tokens from logs
 * FR-024: Limit /status payload to non-sensitive fields
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function redactSensitiveFields(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const sensitiveKeys = [
    "authorization",
    "cookie",
    "x-api-key",
    "token",
    "secret",
    "password",
    "api_key",
    "access_token",
    "refresh_token",
    "id_token",
  ];

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = redactSensitiveFields(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Generate or retrieve trace ID for request correlation
 * Pulls from x-trace-id header if present, otherwise generates new UUID
 */
export function getOrGenerateTraceId(headers?: Record<string, string | string[]>): string {
  if (headers) {
    const traceId = headers["x-trace-id"];
    if (typeof traceId === "string") {
      return traceId;
    }
    if (Array.isArray(traceId) && traceId.length > 0) {
      return traceId[0];
    }
  }

  return uuidv4();
}

/**
 * Structured logging helper for trace correlation
 * Ensures all required fields are present and sensitive data is redacted
 */
export function createTraceLogger() {
  return {
    /**
     * Log an HTTP request/response with required fields
     *
     * Sampling Strategy (FR-028: 100% sampling for ok:false /status events):
     * - ✅ Log successful requests (ok:true) regardless of route
     * - ✅ Log failed /status requests (ok:false + route=/status) - for debugging health checks
     * - ❌ Don't log failed non-/status requests (ok:false + route!=/status) - avoid log spam
     *
     * This pattern ensures critical /status endpoint failures are always visible for debugging
     * while preventing excessive logging of user-facing request failures (handled by error middleware).
     */
    logRequest(
      entry: Partial<TraceLogEntry> & {
        trace: string;
        route: string;
        latency_ms: number;
        status: number;
      }
    ): void {
      const fullEntry: TraceLogEntry = {
        timestamp: new Date().toISOString(),
        method: entry.method || "UNKNOWN",
        reason: entry.reason,
        ok: entry.ok !== undefined ? entry.ok : entry.status >= 200 && entry.status < 300,
        upstream_status: entry.upstream_status,
        ...entry,
      };

      // Sampling: 100% for successful requests OR failed /status (health check debugging)
      const shouldLog = fullEntry.ok || (fullEntry.route === "/status" && !fullEntry.ok);

      if (shouldLog) {
        console.log(JSON.stringify(redactSensitiveFields(fullEntry)));
      }
    },

    /**
     * Log with automatic latency measurement
     */
    async logWithTiming<T>(
      fn: () => Promise<T>,
      traceId: string,
      route: string,
      method: string = "GET"
    ): Promise<T> {
      const start = Date.now();

      try {
        const result = await fn();
        const latency = Date.now() - start;

        this.logRequest({
          trace: traceId,
          route,
          method,
          latency_ms: latency,
          status: 200,
          ok: true,
        });

        return result;
      } catch (error) {
        const latency = Date.now() - start;

        this.logRequest({
          trace: traceId,
          route,
          method,
          latency_ms: latency,
          status: error instanceof Error ? 500 : 500,
          ok: false,
          reason: error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
      }
    },
  };
}

export const traceLogger = createTraceLogger();
