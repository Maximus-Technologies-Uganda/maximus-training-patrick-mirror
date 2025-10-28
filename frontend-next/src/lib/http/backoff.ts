const DEFAULT_BASE_DELAY_MS = 200;
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_JITTER_RATIO = 0.2;

/**
 * Metadata emitted for each retry attempt when handling HTTP 429 responses.
 */
export interface RateLimitRetryInfo {
  attempt: number;
  delayMs: number;
  retryAfterMs?: number;
  limit?: number;
  remaining?: number;
  response: Response;
}

/**
 * Configuration for {@link with429Backoff}.
 */
export interface RateLimitRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  random?: () => number;
  signal?: AbortSignal;
  sleepFn?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
  onRetry?: (info: RateLimitRetryInfo) => void;
}

function resolveCommitSleepFn(): (delayMs: number, signal?: AbortSignal) => Promise<void> {
  return async (delayMs: number, signal?: AbortSignal): Promise<void> => {
    if (delayMs <= 0) {
      if (signal?.aborted) {
        throw resolveAbortError(signal);
      }
      return;
    }

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(resolveAbortError(signal));
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, delayMs);

      const onAbort = (): void => {
        clearTimeout(timeout);
        cleanup();
        reject(resolveAbortError(signal!));
      };

      const cleanup = (): void => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      };

      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  };
}

function resolveAbortError(signal: AbortSignal): Error {
  const reason = "reason" in signal ? signal.reason : undefined;
  if (reason instanceof Error) {
    return reason;
  }
  if (typeof reason === "string" && reason.trim().length > 0) {
    const error = new Error(reason);
    error.name = "AbortError";
    return error;
  }
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

function getRetryAfterDelay(header: string | null): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();
  if (!trimmed) return undefined;
  const numeric = Number.parseFloat(trimmed);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.round(numeric * 1000);
  }
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : 0;
  }
  return undefined;
}

function parseIntegerHeader(value: string | null): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(parsed) && parsed >= 0) {
    return parsed;
  }
  return undefined;
}

function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  jitterRatio: number,
  maxDelayMs: number | undefined,
  retryAfterMs: number | undefined,
  random: () => number,
): number {
  if (retryAfterMs !== undefined) {
    if (maxDelayMs !== undefined) {
      return Math.min(retryAfterMs, maxDelayMs);
    }
    return retryAfterMs;
  }
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const jitterWindow = exponential * Math.max(0, jitterRatio);
  const jitterOffset = jitterWindow > 0 ? (random() * 2 - 1) * jitterWindow : 0;
  const candidate = Math.max(0, exponential + jitterOffset);
  if (maxDelayMs === undefined) {
    return candidate;
  }
  return Math.min(candidate, maxDelayMs);
}

function ensurePositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function ensureAttempts(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_MAX_ATTEMPTS;
  }
  return Math.max(1, Math.trunc(value));
}

function ensureSignal(signal: AbortSignal | undefined): AbortSignal | undefined {
  if (!signal) return undefined;
  if (typeof signal.throwIfAborted === "function") {
    signal.throwIfAborted();
  } else if (signal.aborted) {
    throw resolveAbortError(signal);
  }
  return signal;
}

/**
 * Executes an async operation, automatically retrying on HTTP 429 responses with
 * exponential backoff.
 *
 * @example
 * ```ts
 * const response = await with429Backoff(() => fetch(url, init));
 * if (response.status === 429) {
 *   // Exhausted all attempts. Surface guidance to the user.
 * }
 * ```
 */
export async function with429Backoff(
  operation: (attempt: number) => Promise<Response>,
  options: RateLimitRetryOptions = {},
): Promise<Response> {
  const maxAttempts = ensureAttempts(options.maxAttempts);
  const baseDelayMs = ensurePositive(options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS, DEFAULT_BASE_DELAY_MS);
  const jitterRatio = options.jitterRatio ?? DEFAULT_JITTER_RATIO;
  const maxDelayMs = options.maxDelayMs;
  const random = options.random ?? Math.random;
  const signal = options.signal;
  const sleepFn = options.sleepFn ?? resolveCommitSleepFn();

  let lastResponse: Response | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal) {
      ensureSignal(signal);
    }

    const response = await operation(attempt);
    if (response.status !== 429) {
      return response;
    }

    lastResponse = response;
    if (attempt >= maxAttempts) {
      return response;
    }

    const retryAfterMs = getRetryAfterDelay(response.headers.get("Retry-After"));
    const delayMs = computeBackoffDelay(
      attempt,
      baseDelayMs,
      jitterRatio,
      maxDelayMs,
      retryAfterMs,
      random,
    );

    options.onRetry?.({
      attempt,
      delayMs,
      retryAfterMs,
      limit: parseIntegerHeader(response.headers.get("X-RateLimit-Limit")),
      remaining: parseIntegerHeader(response.headers.get("X-RateLimit-Remaining")),
      response,
    });

    await sleepFn(delayMs, signal);
  }

  // Should never happen, but return the last response defensively in case the loop exits unexpectedly.
  if (lastResponse) {
    return lastResponse;
  }

  return operation(1);
}

export type { RateLimitRetryOptions as RateLimitOptions };
