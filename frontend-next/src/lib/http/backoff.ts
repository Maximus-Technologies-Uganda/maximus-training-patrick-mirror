/**
 * Retry helper with exponential backoff that enforces idempotency safety.
 * POST requests are never retried, while PUT/PATCH retries must reuse the
 * same idempotency key on every attempt.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export interface RetryBackoffOptions {
  method: HttpMethod;
  maxAttempts?: number;
  baseDelayMs?: number;
  random?: () => number;
  idempotencyKey?: string;
}

export interface RetryContext {
  /** Zero-based attempt index. */
  attempt: number;
  /** Stable idempotency key (when required). */
  idempotencyKey?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMethod(method: HttpMethod): HttpMethod {
  return method.toUpperCase() as HttpMethod;
}

function normalizeIdempotencyKey(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireIdempotencyKey(method: HttpMethod, key: string | undefined): void {
  if ((method === "PUT" || method === "PATCH") && !normalizeIdempotencyKey(key)) {
    throw new Error("Idempotency key is required when retrying PUT/PATCH requests");
  }
}

function computeDelay(attempt: number, baseDelayMs: number, random: () => number): number {
  const jitterBase = random();
  const jitter = Number.isFinite(jitterBase) ? 0.5 + Math.max(0, Math.min(1, jitterBase)) : 1;
  return Math.round(baseDelayMs * Math.pow(2, attempt) * jitter);
}

export interface RetryWithBackoffOptions extends RetryBackoffOptions {
  /** Optional hook invoked before the final error is thrown. */
  onRetryFailure?: (error: unknown) => void;
}

/**
 * Execute `operation` with exponential backoff, enforcing safe retry behaviour
 * for mutating requests. The same idempotency key is provided to every attempt
 * via the context object. Throws on final failure.
 */
export async function retryWithIdempotencyBackoff<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: RetryWithBackoffOptions,
): Promise<T> {
  const method = normalizeMethod(options.method);
  if (method === "POST") {
    throw new Error(
      "POST requests are not idempotent — refuse to retry. See README.md#idempotency-and-retries for guidance.",
    );
  }

  requireIdempotencyKey(method, options.idempotencyKey);
  const stableIdempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);
  const enforceStableKey = stableIdempotencyKey !== undefined;

  const maxAttempts = options.maxAttempts && options.maxAttempts > 0 ? options.maxAttempts : 1;
  const baseDelayMs = options.baseDelayMs && options.baseDelayMs > 0 ? options.baseDelayMs : 100;
  const rng = options.random ?? Math.random;

  let attempt = 0;
  let lastError: unknown;
  while (attempt < maxAttempts) {
    if (enforceStableKey && normalizeIdempotencyKey(options.idempotencyKey) !== stableIdempotencyKey) {
      throw new Error("Idempotency key must remain constant across retries");
    }
    try {
      return await operation({ attempt, idempotencyKey: stableIdempotencyKey });
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (enforceStableKey && normalizeIdempotencyKey(options.idempotencyKey) !== stableIdempotencyKey) {
        throw new Error("Idempotency key must remain constant across retries");
      }
      if (attempt >= maxAttempts) {
        if (options.onRetryFailure) options.onRetryFailure(error);
        break;
      }
      const delay = computeDelay(attempt - 1, baseDelayMs, rng);
      await sleep(delay);
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(String(lastError ?? "Retry operation failed"));
}

export interface With429BackoffOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  jitterRatio?: number;
  random?: () => number;
  sleepFn?: (ms: number, signal?: AbortSignal) => Promise<void>;
  onRetry?: (info: { retryAfterMs: number; limit?: number; remaining?: number }) => void;
  signal?: AbortSignal;
}

function parseRetryAfter(header: string | undefined): number {
  if (!header) return 1000; // Default 1 second
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  const date = new Date(header);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  return 1000;
}

function computeExponentialDelay(attempt: number, baseDelayMs: number, jitterRatio: number, rng: () => number): number {
  const exponential = Math.pow(2, attempt) * baseDelayMs;
  const jitter = exponential * jitterRatio * rng();
  return Math.round(exponential + jitter);
}

export async function with429Backoff(
  operation: () => Promise<Response>,
  options: With429BackoffOptions = {},
): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const jitterRatio = options.jitterRatio ?? 0.1;
  const sleepFn = options.sleepFn ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const rng = options.random ?? Math.random;
  const signal = options.signal;

  let attempt = 0;
  while (attempt < maxAttempts) {
    if (signal?.aborted) {
      throw signal.reason instanceof Error ? signal.reason : new Error("Aborted");
    }

    const res = await operation();
    if (res.status !== 429) {
      return res;
    }

    attempt += 1;
    if (attempt >= maxAttempts) {
      return res;
    }

    const retryAfter = parseRetryAfter(res.headers.get("Retry-After") ?? undefined);
    const limit = res.headers.get("X-RateLimit-Limit");
    const remaining = res.headers.get("X-RateLimit-Remaining");

    if (options.onRetry) {
      options.onRetry({
        retryAfterMs: retryAfter,
        limit: limit ? parseInt(limit, 10) : undefined,
        remaining: remaining ? parseInt(remaining, 10) : undefined,
      });
    }

    // Use exponential backoff if Retry-After is not available (default 1000ms)
    const delay = res.headers.has("Retry-After")
      ? retryAfter
      : computeExponentialDelay(attempt - 1, baseDelayMs, jitterRatio, rng);

    await sleepFn(delay, signal);
  }

  return operation();
}

export default retryWithIdempotencyBackoff;
