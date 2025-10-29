import express from "express";
import request from "supertest";
import { createRateLimiter } from "../src/middleware/rateLimit";

function makeApp(max = 1, options?: { trustProxy?: unknown }) {
  const app = express();
  if (options && typeof options.trustProxy !== "undefined") {
    app.set("trust proxy", options.trustProxy as never);
  }

  app.use((req, _res, next) => {
    const testUserId = req.get("x-test-user-id");
    if (typeof testUserId === "string" && testUserId.trim()) {
      (req as unknown as { user?: { userId?: string } }).user = {
        userId: testUserId.trim(),
      };
    }

    next();
  });

  app.use(
    createRateLimiter({
      windowMs: 60_000,
      max,
    })
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  return app;
}

function expectLimiterDetails(body: unknown, expectedScope: string) {
  const details = (body as { details?: unknown }).details;
  expect(Array.isArray(details)).toBe(true);
  const casted = details as Array<Record<string, unknown>>;
  expect(casted).toHaveLength(1);
  expect(casted[0]).toMatchObject({
    scope: expectedScope,
    limit: "1 requests per 60 seconds",
    retryAfterSeconds: 60,
  });
}

describe("Rate limit key precedence (T108)", () => {
  it("uses userId when present (separate buckets per user)", async () => {
    const app = makeApp(1);

    // First user within limit
    const r1 = await request(app).get("/health").set("X-Test-User-Id", "u1");
    expect(r1.status).toBe(200);

    // Same user exceeds limit
    const r2 = await request(app).get("/health").set("X-Test-User-Id", "u1");
    expect(r2.status).toBe(429);
    expectLimiterDetails(r2.body, "user");

    // Different user should have independent bucket
    const r3 = await request(app).get("/health").set("X-Test-User-Id", "u2");
    expect(r3.status).toBe(200);
  });

  it("falls back to req.ip when userId is absent", async () => {
    const app = makeApp(1);

    const r1 = await request(app).get("/health").set("X-Forwarded-For", "1.2.3.4");
    expect(r1.status).toBe(200);

    const r2 = await request(app).get("/health").set("X-Forwarded-For", "5.6.7.8");
    expect(r2.status).toBe(429);
    expectLimiterDetails(r2.body, "ip");
  });

  it("honours X-Forwarded-For when trust proxy is enabled", async () => {
    const app = makeApp(1, { trustProxy: true });

    const r1 = await request(app).get("/health").set("X-Forwarded-For", "1.2.3.4");
    expect(r1.status).toBe(200);

    const r2 = await request(app).get("/health").set("X-Forwarded-For", "1.2.3.4");
    expect(r2.status).toBe(429);

    const r3 = await request(app).get("/health").set("X-Forwarded-For", "5.6.7.8");
    expect(r3.status).toBe(200);
  });

  it("prefers userId over IP when both provided", async () => {
    const app = makeApp(1);

    const r1 = await request(app)
      .get("/health")
      .set("X-Test-User-Id", "u1")
      .set("X-Forwarded-For", "1.2.3.4");
    expect(r1.status).toBe(200);

    // Change IP but same user -> should still be limited by user bucket
    const r2 = await request(app)
      .get("/health")
      .set("X-Test-User-Id", "u1")
      .set("X-Forwarded-For", "5.6.7.8");
    expect(r2.status).toBe(429);
  });

  it("ignores X-User-Id header when auth context is absent", async () => {
    const app = makeApp(1);

    const r1 = await request(app)
      .get("/health")
      .set("X-User-Id", "spoofed")
      .set("X-Forwarded-For", "1.2.3.4");
    expect(r1.status).toBe(200);

    const r2 = await request(app)
      .get("/health")
      .set("X-User-Id", "different")
      .set("X-Forwarded-For", "5.6.7.8");
    expect(r2.status).toBe(429);
  });

  it("skips rate limiting for OPTIONS requests (T038)", async () => {
    const app = makeApp(1);

    // OPTIONS request should always succeed regardless of previous requests
    const r1 = await request(app).options("/health").set("X-Test-User-Id", "u1");
    expect(r1.status).toBe(200);

    // Make some requests to exhaust the rate limit
    await request(app).get("/health").set("X-Test-User-Id", "u1");
    await request(app).get("/health").set("X-Test-User-Id", "u1");
    // This should be rate limited
    const r2 = await request(app).get("/health").set("X-Test-User-Id", "u1");
    expect(r2.status).toBe(429);

    // OPTIONS should still work even after rate limit is hit
    const r3 = await request(app).options("/health").set("X-Test-User-Id", "u1");
    expect(r3.status).toBe(200);

    // And OPTIONS should not include rate limit headers
    const rateLimitHeaders = Object.keys(r3.headers).filter(h => h.includes('ratelimit') || h.includes('retry-after'));
    expect(rateLimitHeaders).toHaveLength(0);
  });
});

