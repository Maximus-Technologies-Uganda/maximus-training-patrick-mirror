import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signIn, signOut, getIdToken, fetchWithAuthRetry } from "./auth";

// Mock Firebase modules
vi.mock("firebase/app", () => ({}));
vi.mock("firebase/auth", () => ({}));

// Mock backoff
vi.mock("../http/backoff", () => ({
  with429Backoff: (fn: () => Promise<Response>) => fn(),
}));

describe("auth", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

    // Store original fetch and replace with mock
    originalFetch = global.fetch;
    global.fetch = vi.fn(
      async () => new Response(null, { status: 200 })
    ) as unknown as typeof global.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe("signIn", () => {
    it("falls back to BFF when Firebase is not available", async () => {
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await signIn("user@example.com", "password");

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      );
    });

    it("handles failed login", async () => {
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const result = await signIn("user@example.com", "wrong-password");

      expect(result.ok).toBe(false);
    });
  });

  describe("signOut", () => {
    it("calls logout endpoint", async () => {
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      await signOut();

      expect(global.fetch).toHaveBeenCalledWith(
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
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      const mockResponse = new Response(null, { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchWithAuthRetry("/api/test");

      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("retries once on 401 status", async () => {
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      const unauthorizedResponse = new Response(null, { status: 401 });
      const successResponse = new Response(null, { status: 200 });

      mockFetch.mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce(successResponse);

      const result = await fetchWithAuthRetry("/api/test");

      expect(result).toBe(successResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("handles retry failure gracefully", async () => {
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      const unauthorizedResponse = new Response(null, { status: 401 });

      mockFetch
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockResolvedValueOnce(unauthorizedResponse);

      const result = await fetchWithAuthRetry("/api/test");

      expect(result.status).toBe(401);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("passes init options to fetch", async () => {
      const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const init: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };

      await fetchWithAuthRetry("/api/test", init);

      expect(global.fetch).toHaveBeenCalledWith("/api/test", init);
    });
  });
});
