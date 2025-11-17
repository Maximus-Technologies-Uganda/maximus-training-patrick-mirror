import "server-only";

import { GoogleAuth } from "google-auth-library";

type HeadersDictionary = Record<string, string>;

const googleAuth = new GoogleAuth();
let cachedClientPromise: Promise<import("google-auth-library").IdTokenClient> | null = null;

function normalizeHeaders(headers?: HeadersInit): HeadersDictionary {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

async function getIdTokenClient(audience: string) {
  if (!cachedClientPromise) {
    cachedClientPromise = googleAuth.getIdTokenClient(audience);
  }
  return cachedClientPromise;
}

function withBaseUrl(path: string, baseUrl: string): string {
  try {
    return new URL(path, baseUrl).toString();
  } catch (error) {
    throw new Error(`fetchApi: failed to build URL for ${path}: ${(error as Error).message}`);
  }
}

const MAX_ATTEMPTS = 2;

function jitterDelay(attempt: number): number {
  const base = 50 * (attempt + 1);
  return base + Math.floor(Math.random() * 60);
}

/**
 * Server-side fetch with Google ID token authentication.
 *
 * In development/testing without API_BASE_URL, falls back to local /api routes.
 * In production, requires API_BASE_URL and ID_TOKEN_AUDIENCE environment variables.
 */
export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.API_BASE_URL;

  // If no API_BASE_URL, we're in local dev/test mode - fall through to caller's fallback
  if (!baseUrl) {
    throw new Error("fetchApi: missing required env API_BASE_URL");
  }

  const audience = process.env.ID_TOKEN_AUDIENCE ?? baseUrl;
  const client = await getIdTokenClient(audience);
  const url = withBaseUrl(path, baseUrl);
  const headers: HeadersDictionary = {
    Accept: "application/json",
    ...normalizeHeaders(init?.headers),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.request<T>({
        url,
        method: init?.method ?? "GET",
        headers,
        data: init?.body as unknown,
      });
      if (response.status >= 400) {
        lastError = new Error(`Upstream ${response.status}`);
        break;
      }
      return response.data as T;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS - 1) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, jitterDelay(attempt)));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("fetchApi: request failed");
}
