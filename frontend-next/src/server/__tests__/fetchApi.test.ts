import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchApi, initializeIdTokenClient, fetchApiWithTrace } from "../fetchApi";

// Mock the retry module
vi.mock("../retry", () => ({
  retryWithBackoff: vi.fn(async (fn) => fn()),
}));

// Mock fetch
global.fetch = vi.fn();

describe("fetchApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializeIdTokenClient("http://test-api.example.com");
  });

  it("should require initialization", async () => {
    const uninitializedFn = async () => {
      const ApiModule = await import("../fetchApi");
      // Reset the module
      vi.resetModules();
      return ApiModule.fetchApi("http://test-api.example.com/posts");
    };

    await expect(uninitializedFn()).rejects.toThrow("not initialized");
  });

  it("should fetch with trace ID injection", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: "test" }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await fetchApi("http://test-api.example.com/posts", { traceId: "trace-123" });

    expect(global.fetch).toHaveBeenCalled();
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["x-trace-id"]).toBe("trace-123");
  });

  it("should include authorization header", async () => {
    const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({}) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await fetchApi("http://test-api.example.com/posts");

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBeDefined();
    expect(options.headers.Authorization).toMatch(/^Bearer/);
  });

  it("should set content type", async () => {
    const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({}) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await fetchApi("http://test-api.example.com/posts");

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("should return data with metadata", async () => {
    const responseData = { posts: ["post1", "post2"] };
    const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue(responseData) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await fetchApi("http://test-api.example.com/posts");

    expect(result.data).toEqual(responseData);
    expect(result.status).toBe(200);
    expect(result.traceId).toBeDefined();
    expect(result.upstreamStatus).toBe(200);
  });

  it("should use provided trace ID", async () => {
    const mockResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await fetchApi("http://test-api.example.com/posts", { traceId: "custom-trace" });

    expect(result.traceId).toBe("custom-trace");
  });

  it("should generate trace ID if not provided", async () => {
    const mockResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await fetchApi("http://test-api.example.com/posts");

    expect(result.traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

describe("fetchApiWithTrace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initializeIdTokenClient("http://test-api.example.com");
  });

  it("should return only data", async () => {
    const responseData = { posts: ["post1"] };
    const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue(responseData) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await fetchApiWithTrace("http://test-api.example.com/posts", "trace-123");

    expect(result).toEqual(responseData);
  });

  it("should use provided trace ID", async () => {
    const mockResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await fetchApiWithTrace("http://test-api.example.com/posts", "trace-456");

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["x-trace-id"]).toBe("trace-456");
  });
});
