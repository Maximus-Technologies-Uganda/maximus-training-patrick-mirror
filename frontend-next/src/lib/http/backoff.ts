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

function requireIdempotencyKey(method: HttpMethod, key: string | undefined): void {
  if ((method === "PUT" || method === "PATCH") && (!key || key.trim().length === 0)) {
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

  const maxAttempts = options.maxAttempts && options.maxAttempts > 0 ? options.maxAttempts : 1;
  const baseDelayMs = options.baseDelayMs && options.baseDelayMs > 0 ? options.baseDelayMs : 100;
  const rng = options.random ?? Math.random;

  let attempt = 0;
  let lastError: unknown;
  while (attempt < maxAttempts) {
    try {
      return await operation({ attempt, idempotencyKey: options.idempotencyKey });
    } catch (error) {
      lastError = error;
      attempt += 1;
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

export default retryWithIdempotencyBackoff;
