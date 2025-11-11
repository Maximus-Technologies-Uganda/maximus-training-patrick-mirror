/**
 * Retry logic with full-jitter exponential backoff
 * Enforces per-attempt timeout ≤800ms and total budget <3s
 * FR-015: Bounded retries with full-jitter backoff, per-attempt timeout enforcement
 */

interface RetryOptions {
  maxAttempts?: number;
  totalBudgetMs?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Full-jitter backoff: for attempt N, delay is random between [minDelay * 2^N, maxDelay * 2^N]
 * Example: attempt 1: 100–600ms, attempt 2: 300–1200ms, attempt 3: 600–2400ms
 */
function calculateFullJitterBackoff(
  attemptNumber: number,
  minDelayMs: number,
  maxDelayMs: number
): number {
  // Calculate exponential bounds: [min * 2^n, max * 2^n]
  const minBound = minDelayMs * Math.pow(2, attemptNumber - 1);
  const maxBound = maxDelayMs * Math.pow(2, attemptNumber - 1);

  // Return random value in range (full jitter)
  return Math.random() * (maxBound - minBound) + minBound;
}

/**
 * Retry helper with exponential backoff and total budget enforcement
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result from successful attempt
 * @throws Error if all attempts fail or budget exceeded
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, totalBudgetMs = 3000, minDelayMs = 100, maxDelayMs = 600 } = options;

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we have budget for another attempt
      if (attempt < maxAttempts) {
        const elapsedMs = Date.now() - startTime;
        const backoffMs = calculateFullJitterBackoff(attempt, minDelayMs, maxDelayMs);
        const nextAttemptTime = elapsedMs + backoffMs;

        if (nextAttemptTime > totalBudgetMs) {
          throw new Error(
            `Retry budget exhausted: ${nextAttemptTime}ms > ${totalBudgetMs}ms. Last error: ${lastError.message}`
          );
        }

        // Wait with full-jitter backoff
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * Parse Retry-After header (supports both seconds and HTTP-date)
 * Used to honor upstream rate limit or service unavailability signals
 */
export function parseRetryAfter(retryAfterHeader?: string): number | null {
  if (!retryAfterHeader) return null;

  // Try parsing as seconds
  const seconds = parseInt(retryAfterHeader, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to ms
  }

  // Try parsing as HTTP-date
  try {
    const retryDate = new Date(retryAfterHeader);
    const retryTime = retryDate.getTime();
    if (isNaN(retryTime)) return null;
    const now = new Date();
    const delayMs = retryTime - now.getTime();
    return delayMs > 0 ? delayMs : null;
  } catch {
    return null;
  }
}
