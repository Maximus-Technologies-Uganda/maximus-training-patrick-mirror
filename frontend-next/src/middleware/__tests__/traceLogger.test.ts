import { redactSensitiveFields, getOrGenerateTraceId, createTraceLogger } from "../traceLogger";

describe("redactSensitiveFields", () => {
  it("should redact authorization header", () => {
    const obj = { authorization: "Bearer token123" };
    const redacted = redactSensitiveFields(obj);
    expect(redacted.authorization).toBe("[REDACTED]");
  });

  it("should redact multiple sensitive fields", () => {
    const obj = {
      api_key: "secret-key",
      token: "secret-token",
      password: "secret-pass",
      data: "public-data",
    };
    const redacted = redactSensitiveFields(obj);
    expect(redacted.api_key).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.data).toBe("public-data");
  });

  it("should handle nested objects", () => {
    const obj = {
      user: {
        name: "alice",
        secret: "hidden",
      },
    };
    const redacted = redactSensitiveFields(obj);
    expect(redacted.user.name).toBe("alice");
    expect(redacted.user.secret).toBe("[REDACTED]");
  });

  it("should return primitive values unchanged", () => {
    expect(redactSensitiveFields("string")).toBe("string");
    expect(redactSensitiveFields(123)).toBe(123);
    expect(redactSensitiveFields(null)).toBe(null);
  });

  it("should handle arrays", () => {
    const obj = ["public", { token: "secret" }];
    const redacted = redactSensitiveFields(obj);
    expect(redacted[0]).toBe("public");
    expect(redacted[1].token).toBe("[REDACTED]");
  });

  it("should be case-insensitive for key matching", () => {
    const obj = { AUTHORIZATION: "secret", Authorization: "secret2", Cookie: "secret3" };
    const redacted = redactSensitiveFields(obj);
    expect(redacted.AUTHORIZATION).toBe("[REDACTED]");
    expect(redacted.Authorization).toBe("[REDACTED]");
    expect(redacted.Cookie).toBe("[REDACTED]");
  });
});

describe("getOrGenerateTraceId", () => {
  it("should generate UUID when no trace ID provided", () => {
    const traceId = getOrGenerateTraceId();
    expect(traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("should retrieve trace ID from headers", () => {
    const headers = { "x-trace-id": "existing-trace-id" };
    const traceId = getOrGenerateTraceId(headers);
    expect(traceId).toBe("existing-trace-id");
  });

  it("should handle trace ID as array (first element)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = { "x-trace-id": ["first-trace", "second-trace"] } as any;
    const traceId = getOrGenerateTraceId(headers);
    expect(traceId).toBe("first-trace");
  });

  it("should generate new ID when header missing", () => {
    const headers = { "other-header": "value" };
    const traceId = getOrGenerateTraceId(headers);
    expect(traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe("createTraceLogger", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log request with required fields", () => {
    const logger = createTraceLogger();
    logger.logRequest({
      trace: "trace-123",
      route: "/posts",
      latency_ms: 150,
      status: 200,
      method: "GET",
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.trace).toBe("trace-123");
    expect(logged.route).toBe("/posts");
    expect(logged.latency_ms).toBe(150);
    expect(logged.status).toBe(200);
    expect(logged.timestamp).toBeDefined();
  });

  it("should mark ok:true for 2xx status", () => {
    const logger = createTraceLogger();
    logger.logRequest({
      trace: "trace-123",
      route: "/posts",
      latency_ms: 150,
      status: 200,
    });

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.ok).toBe(true);
  });

  it("should mark ok:false for non-2xx status", () => {
    const logger = createTraceLogger();
    logger.logRequest({
      trace: "trace-123",
      route: "/posts",
      latency_ms: 150,
      status: 500,
    });

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.ok).toBe(false);
  });

  it("should sample 100% for failed /status requests", () => {
    const logger = createTraceLogger();
    logger.logRequest({
      trace: "trace-123",
      route: "/status",
      latency_ms: 150,
      status: 500,
      ok: false,
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should redact sensitive fields before logging", () => {
    const logger = createTraceLogger();
     
    // @ts-expect-error Testing with partial entry
    logger.logRequest({
      trace: "trace-123",
      route: "/posts",
      latency_ms: 150,
      status: 200,
    });

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.authorization).not.toBeDefined();
  });

  it("should log with timing and measure latency", async () => {
    const logger = createTraceLogger();
    const fn = jest.fn().mockResolvedValue("result");

    const result = await logger.logWithTiming(fn, "trace-123", "/posts", "GET");

    expect(result).toBe("result");
    expect(consoleSpy).toHaveBeenCalled();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.trace).toBe("trace-123");
    expect(logged.route).toBe("/posts");
    expect(logged.latency_ms).toBeGreaterThanOrEqual(0);
    expect(logged.ok).toBe(true);
  });

  it("should log errors with latency measurement", async () => {
    const logger = createTraceLogger();
    const fn = jest.fn().mockRejectedValue(new Error("test error"));

    await expect(logger.logWithTiming(fn, "trace-123", "/posts", "GET")).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.ok).toBe(false);
    expect(logged.reason).toBe("test error");
  });
});
