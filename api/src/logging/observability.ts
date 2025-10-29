import { shouldLog, type LogLevel, type SamplingConfig } from "./sampling";
import { sanitize, scrubSerializedPayload } from "./redaction";

export interface LogFields {
  requestId?: string;
  traceId?: string;
  userId?: string;
  role?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  target?: string;
  component?: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
  rateLimit?: {
    limit?: number;
    remaining?: number;
    reset?: number;
    retryAfter?: number;
  };
}

export interface LoggerOptions {
  component?: string;
  sampling?: Partial<SamplingConfig>;
  clock?: () => Date;
  writer?: (line: string) => void;
}

interface StructuredEvent extends Record<string, unknown> {
  ts: string;
  level: LogLevel;
  message: string;
  component: string;
}

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    const base: Record<string, unknown> = {
      errorName: error.name,
      errorMessage: error.message,
    };
    if (typeof error.stack === "string") {
      base.errorStack = error.stack;
    }
    return base;
  }
  if (typeof error === "object") {
    return error as Record<string, unknown>;
  }
  return { error: String(error) };
}

function mergeEvent(
  level: LogLevel,
  message: string,
  fields: LogFields | undefined,
  options: LoggerOptions,
): StructuredEvent {
  const now = (options.clock ?? (() => new Date()))();
  const component = fields?.component ?? options.component ?? "api";
  const event: StructuredEvent = {
    ts: now.toISOString(),
    level,
    message,
    component,
  };
  if (fields?.requestId) event.requestId = fields.requestId;
  if (fields?.traceId) event.traceId = fields.traceId;
  if (fields?.userId) event.userId = fields.userId;
  if (fields?.role) event.role = fields.role;
  if (fields?.method) event.method = fields.method;
  if (fields?.path) event.path = fields.path;
  if (typeof fields?.status === "number") event.status = fields.status;
  if (typeof fields?.durationMs === "number") event.latencyMs = Math.round(fields.durationMs * 1000) / 1000;
  if (fields?.target) event.target = fields.target;
  if (fields?.metadata) {
    for (const [key, value] of Object.entries(fields.metadata)) {
      event[key] = value;
    }
  }
  if (fields?.rateLimit) {
    const rateLimit: Record<string, number> = {};
    if (typeof fields.rateLimit.limit === "number" && Number.isFinite(fields.rateLimit.limit)) {
      rateLimit.limit = fields.rateLimit.limit;
    }
    if (typeof fields.rateLimit.remaining === "number" && Number.isFinite(fields.rateLimit.remaining)) {
      rateLimit.remaining = fields.rateLimit.remaining;
    }
    if (typeof fields.rateLimit.reset === "number" && Number.isFinite(fields.rateLimit.reset)) {
      rateLimit.reset = fields.rateLimit.reset;
    }
    if (typeof fields.rateLimit.retryAfter === "number" && Number.isFinite(fields.rateLimit.retryAfter)) {
      rateLimit.retryAfter = fields.rateLimit.retryAfter;
    }
    if (Object.keys(rateLimit).length > 0) {
      event.rateLimit = rateLimit;
    }
  }
  const errorPayload = serializeError(fields?.error);
  if (errorPayload) {
    for (const [key, value] of Object.entries(errorPayload)) {
      event[key] = value;
    }
  }
  return event;
}

function output(event: StructuredEvent, writer: (line: string) => void): void {
  try {
    const sanitized = sanitize(event);
    const serialized = JSON.stringify(sanitized);
    const scrubbed = scrubSerializedPayload(serialized);
    writer(scrubbed);
  } catch (error) {
    const fallback = {
      ts: new Date().toISOString(),
      level: "error" as const,
      message: "failed to serialize log event",
      component: "logging",
      details: {
        originalMessage: event.message,
      },
    };
    writer(JSON.stringify(fallback));
    if (error instanceof Error) {
      writer(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error", 
          message: error.message,
          component: "logging",
        }),
      );
    }
  }
}

export interface ObservabilityLogger {
  log(level: LogLevel, message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  audit(message: string, fields?: LogFields): void;
}

export function createObservabilityLogger(options: LoggerOptions = {}): ObservabilityLogger {
  const writer = options.writer ?? ((line: string) => {
    // eslint-disable-next-line no-console
    console.log(line);
  });

  function emit(level: LogLevel, message: string, fields?: LogFields): void {
    if (!shouldLog(level, { config: options.sampling })) {
      return;
    }
    const event = mergeEvent(level, message, fields, options);
    output(event, writer);
  }

  return {
    log: emit,
    info: (message, fields) => emit("info", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    error: (message, fields) => emit("error", message, fields),
    audit: (message, fields) => emit("audit", message, fields),
  };
}

export const defaultLogger = createObservabilityLogger();
