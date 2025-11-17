import "server-only";

import { GoogleAuth } from "google-auth-library";

/**
 * Singleton instance of GoogleAuth to avoid recreating it multiple times.
 * GoogleAuth uses application default credentials from the environment.
 */
const googleAuth = new GoogleAuth();

/**
 * Cache the ID token client promise to avoid recreating it.
 * This is safe because the audience is the same throughout the request lifecycle.
 */
let cachedClientPromise: Promise<import("google-auth-library").IdTokenClient> | null = null;

/**
 * Get or create the ID token client for the given audience.
 * The client is cached to minimize overhead in subsequent calls.
 *
 * @param targetAudience - The Cloud Run service URL or IAP audience
 * @returns Promise resolving to an ID token client
 */
async function getIdTokenClient(targetAudience: string) {
  if (!cachedClientPromise) {
    cachedClientPromise = googleAuth.getIdTokenClient(targetAudience);
  }
  return cachedClientPromise;
}

/**
 * Obtain a Google ID token for authenticating to a Cloud Run service or IAP endpoint.
 *
 * This function extracts the bearer token from the ID token client's request headers.
 * Use this for low-level token access. For HTTP requests, use `buildAuthHeaders()` instead.
 *
 * @param targetAudience - The Cloud Run service URL or IAP audience
 * @returns Promise resolving to the bearer token (without "Bearer " prefix)
 * @throws Error if token cannot be obtained or is malformed
 */
export async function getIdToken(targetAudience: string): Promise<string> {
  const client = await getIdTokenClient(targetAudience);
  const headers = (await client.getRequestHeaders()) as unknown as {
    get?: (name: string) => string | null;
    [key: string]: unknown;
  };

  // Extract Authorization header (case-insensitive)
  const authorization =
    (typeof headers.get === "function" &&
      (headers.get("Authorization") || headers.get("authorization"))) ||
    (typeof headers["Authorization"] === "string" ? (headers["Authorization"] as string) : "") ||
    (typeof headers["authorization"] === "string" ? (headers["authorization"] as string) : "");

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Failed to obtain ID token: invalid or missing Authorization header");
  }

  return authorization.slice("Bearer ".length);
}

/**
 * Build authentication headers for an HTTP request.
 *
 * Includes:
 * - Authorization: Bearer <ID_TOKEN> (if ID_TOKEN_AUDIENCE is set)
 * - X-Service-Authorization: Bearer <SERVICE_TOKEN> (if API_SERVICE_TOKEN is set)
 * - Accept: application/json (standard default)
 *
 * Use this in route handlers and other contexts that need custom headers.
 * For standard server-side fetches, prefer `fetchApi()` which handles auth automatically.
 *
 * @param additionalHeaders - Additional headers to merge (e.g., cookies, x-trace-id)
 * @returns Promise resolving to auth headers object
 * @throws Error if ID token audience is required but not configured
 */
export async function buildAuthHeaders(
  additionalHeaders?: Record<string, string>
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...additionalHeaders,
  };

  const audience = process.env.ID_TOKEN_AUDIENCE ?? process.env.API_BASE_URL;
  const serviceToken = process.env.API_SERVICE_TOKEN;

  // Only mint ID token if we have an audience configured
  if (audience) {
    const idToken = await getIdToken(audience);
    headers.Authorization = `Bearer ${idToken}`;

    // Optionally add service-to-service token as secondary auth
    if (serviceToken) {
      headers["X-Service-Authorization"] = `Bearer ${serviceToken}`;
    }
  } else if (serviceToken) {
    // Fallback: use service token if no ID token audience is set
    headers.Authorization = `Bearer ${serviceToken}`;
  }

  return headers;
}
