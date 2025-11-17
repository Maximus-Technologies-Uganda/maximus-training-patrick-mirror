import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRequest = vi.fn();
const mockGetIdTokenClient = vi.fn();

vi.mock("google-auth-library", () => {
  return {
    GoogleAuth: vi.fn(() => ({
      getIdTokenClient: mockGetIdTokenClient,
    })),
  };
});

describe("fetchApi", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequest.mockReset();
    mockGetIdTokenClient.mockReset();
    mockGetIdTokenClient.mockResolvedValue({ request: mockRequest });
    process.env.API_BASE_URL = "https://api.example.test";
    process.env.ID_TOKEN_AUDIENCE = "https://api.example.test";
  });

  afterEach(() => {
    delete process.env.API_BASE_URL;
    delete process.env.ID_TOKEN_AUDIENCE;
  });

  it("uses the Google ID token client to call the private API", async () => {
    mockRequest.mockResolvedValueOnce({ status: 200, data: { items: [] } });
    const { fetchApi } = await import("./fetchApi");

    await expect(fetchApi("/posts")).resolves.toEqual({ items: [] });

    expect(mockGetIdTokenClient).toHaveBeenCalledWith("https://api.example.test");
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.test/posts",
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it("merges custom headers and method overrides", async () => {
    mockRequest.mockResolvedValueOnce({ status: 200, data: { ok: true } });
    const { fetchApi } = await import("./fetchApi");

    await fetchApi("/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ title: "Test" }),
      })
    );
  });

  it("retries once before surfacing the error", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce({ status: 200, data: { ok: true } });
    const { fetchApi } = await import("./fetchApi");

    await expect(fetchApi("/health")).resolves.toEqual({ ok: true });
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("memoizes the ID token client across calls", async () => {
    mockRequest.mockResolvedValue({ status: 200, data: { ok: true } });
    const { fetchApi } = await import("./fetchApi");

    await fetchApi("/health");
    await fetchApi("/health");

    expect(mockGetIdTokenClient).toHaveBeenCalledTimes(1);
  });

  it("throws when upstream responds with an error status", async () => {
    mockRequest.mockResolvedValueOnce({ status: 503, data: {} });
    const { fetchApi } = await import("./fetchApi");

    await expect(fetchApi("/health")).rejects.toThrow(/Upstream 503/);
  });

  it("falls back to the API base URL when ID_TOKEN_AUDIENCE is unset", async () => {
    delete process.env.ID_TOKEN_AUDIENCE;
    mockRequest.mockResolvedValueOnce({ status: 200, data: { ok: true } });
    const { fetchApi } = await import("./fetchApi");

    await fetchApi("/health");
    expect(mockGetIdTokenClient).toHaveBeenCalledWith("https://api.example.test");
  });

  it("fails fast when required env vars are missing", async () => {
    delete process.env.API_BASE_URL;
    const { fetchApi } = await import("./fetchApi");

    await expect(fetchApi("/health")).rejects.toThrow(/API_BASE_URL/);
  });
});
