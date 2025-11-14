import "server-only";

import { v4 as uuidv4 } from "uuid";
import { retryWithBackoff } from "./retry";
import { getIdToken } from "./auth/getIdToken";

/**
 * Server-only fetch utility for API calls with ID token authentication
 * Implements secure server-side token acquisition (never exposed to client)
 * Includes trace propagation, retry logic, and timeout enforcement
 */

interface FetchApiOptions extends RequestInit {
  traceId?: string;
  timeout?: number;
}

/**
 * ID token acquisition delegated to getIdToken()
 * FR-015 requires reuse of the underlying client and per-attempt timeout enforcement
 * Per-attempt timeout ≤800ms enforced; total budget <3s via retryWithBackoff
 */

/**
 * Server-only fetch with ID token authentication and trace propagation
 * - Acquires ID token server-side (never exposed to client)
 * - Injects x-trace-id header for request correlation
 * - Implements retry logic with full-jitter backoff
 * - Enforces per-attempt timeout ≤800ms, total budget <3s
 * FR-002: Secure server-side token acquisition, no client exposure
 * FR-013: Trace ID propagation
 * FR-015: Retry/backoff with bounded timeouts
 */
export async function fetchApi<T>(
  url: string,
  options: FetchApiOptions = {}
): Promise<{ data: T; traceId: string; status: number; upstreamStatus?: number }> {
  const traceId = options.traceId || uuidv4();
  const audience = process.env.ID_TOKEN_AUDIENCE || process.env.API_BASE_URL || "";
  const token = await getIdToken(audience);

  const headers = {
    "Content-Type": "application/json",
    "x-trace-id": traceId,
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  // Retry wrapper with full-jitter backoff
  const result = await retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeout = options.timeout ?? 800;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        // Return both data and metadata for observability
        const data = await response.json();
        return {
          data,
          status: response.status,
          ok: response.ok,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      maxAttempts: 3,
      totalBudgetMs: 3000, // Total response budget <3s
    }
  );

  return {
    data: result.data,
    traceId,
    status: result.status,
    upstreamStatus: result.status,
  };
}

/**
 * Fetch with automatic retry and trace injection (convenience wrapper)
 */
export async function fetchApiWithTrace<T>(
  url: string,
  traceId: string,
  options?: FetchApiOptions
): Promise<T> {
  const result = await fetchApi<T>(url, { ...options, traceId });
  return result.data;
}
