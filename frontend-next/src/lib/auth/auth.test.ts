import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signIn, signOut, getIdToken, fetchWithAuthRetry } from "./auth";

// Mock Firebase modules
vi.mock("firebase/app", () => ({}));
vi.mock("firebase/auth", () => ({}));

// Mock backoff
vi.mock("../http/backoff", () => ({
  with429Backoff: (fn: () => Promise<Response>) => fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signIn", () => {
    it("falls back to BFF when Firebase is not available", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await signIn("user@example.com", "password");

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      );
    });

    it("handles failed login", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const result = await signIn("user@example.com", "wrong-password");

      expect(result.ok).toBe(false);
    });
  });

  describe("signOut", () => {
    it("calls logout endpoint", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      await signOut();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        })
      );
    });
  });

  describe("getIdToken", () => {
    it("returns empty string when Firebase is not available", async () => {
      const token = await getIdToken();
      expect(token).toBe("");
    });

    it("returns empty string when forceRefresh is true but Firebase unavailable", async () => {
      const token = await getIdToken(true);
      expect(token).toBe("");
    });
  });

  describe("fetchWithAuthRetry", () => {
    it("returns response when status is not 401", async () => {
      const mockFetch = vi.mocked(global.fetch);
      const mockResponse = new Response(null, { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchWithAuthRetry("/api/test");

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries once on 401 status", async () => {
      const mockFetch = vi.mocked(global.fetch);
      const unauthorizedResponse = new Response(null, { status: 401 });
      const successResponse = new Response(null, { status: 200 });

      mockFetch.mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce(successResponse);

      const result = await fetchWithAuthRetry("/api/test");

      expect(result).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("handles retry failure gracefully", async () => {
      const mockFetch = vi.mocked(global.fetch);
      const unauthorizedResponse = new Response(null, { status: 401 });

      mockFetch
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockResolvedValueOnce(unauthorizedResponse);

      const result = await fetchWithAuthRetry("/api/test");

      expect(result.status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("passes init options to fetch", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const init: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };

      await fetchWithAuthRetry("/api/test", init);

      expect(mockFetch).toHaveBeenCalledWith("/api/test", init);
    });
  });
});
