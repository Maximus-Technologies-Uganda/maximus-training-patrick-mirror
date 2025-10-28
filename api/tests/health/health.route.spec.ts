import express from "express";
import request from "supertest";
import {
  createHealthRouter,
  type DependencyCheckResult,
  type HealthRouterOptions,
} from "../../src/routes/health";

describe("GET /health", () => {
  function buildApp(options: HealthRouterOptions = {}) {
    const app = express();
    app.use((_, res, next) => {
      (res.locals as { requestId?: string }).requestId = "test-request";
      next();
    });
    app.use(createHealthRouter(undefined, options));
    return app;
  }

  it("returns 200 with service metadata when dependencies are healthy", async () => {
    const app = buildApp({
      serviceName: "api-test",
      commitSha: "abc123",
      checkFirebase: async () => ({ status: "ok" }),
      checkDatabase: async () => ({ status: "ok" }),
    });

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.service).toBe("api-test");
    expect(res.body.commit).toBe("abc123");
    expect(res.body.status).toBe("ok");
    expect(res.body.dependencies).toEqual({ firebase: "ok", db: "ok" });
    expect(typeof res.body.time).toBe("string");
    expect(new Date(res.body.time).toString()).not.toBe("Invalid Date");
    expect(res.body.requestId).toBe("test-request");
  });

  it("returns 503 and dependency details when a check fails", async () => {
    const app = buildApp({
      checkFirebase: async () => ({ status: "ok" }),
      checkDatabase: async () => ({ status: "down", detail: "db offline" }),
    });

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.dependencies.db).toBe("down");
    expect(res.body.dependencies.firebase).toBe("ok");
    expect(res.body.dependencies.details.db).toContain("db offline");
  });

  it("sets no-store caching headers", async () => {
    const app = buildApp({
      checkFirebase: async () => ({ status: "ok" }),
      checkDatabase: async () => ({ status: "ok" }),
    });

    const res = await request(app).get("/health");

    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.headers["content-type"]).toBe("application/json; charset=utf-8");
  });

  it("marks dependencies down when a checker exceeds its timeout", async () => {
    const app = buildApp({
      dependencyTimeouts: { database: 10 },
      checkFirebase: async () => ({ status: "ok" }),
      checkDatabase: () =>
        new Promise<DependencyCheckResult>((resolve) => {
          setTimeout(() => resolve({ status: "ok" }), 50);
        }),
    });

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.dependencies.db).toBe("down");
    expect(res.body.dependencies.details.db).toContain("timeout");
  });
});

