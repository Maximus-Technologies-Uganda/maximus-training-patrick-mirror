import express from "express";
import request from "supertest";
import { createHealthRouter, type DependencyChecker, type DependencyStatus } from "../src/routes/health";

describe("/health dependency checks", () => {
  function buildApp(checks: Record<string, DependencyChecker>) {
    const app = express();
    app.use(createHealthRouter({ dependencyChecks: checks, serviceName: "api" }));
    return app;
  }

  it("returns 503 when a dependency is down", async () => {
    const app = buildApp({
      firebase: async () => "down",
      db: async () => "ok",
    });

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
    expect(res.body.dependencies).toEqual({ firebase: "down", db: "ok" });
    expect(res.headers["retry-after"]).toBe("60");
  });

  it("omits Retry-After when all dependencies are healthy", async () => {
    const app = buildApp({
      firebase: async () => "ok",
      db: async () => "ok",
    });

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["retry-after"]).toBeUndefined();
  });

  it("marks a dependency down when it exceeds the timeout", async () => {
    const app = express();
    app.use(
      createHealthRouter({
        serviceName: "api",
        dependencyTimeoutMs: 10,
        dependencyChecks: {
          firebase: async () => "ok",
          db: () =>
            new Promise<DependencyStatus>((resolve) => {
              setTimeout(() => resolve("ok"), 50);
            }),
        },
      }),
    );

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.dependencies).toEqual({ firebase: "ok", db: "down" });
  });

  it("caches dependency results for the configured TTL", async () => {
    const timestamps = [0, 2000, 7000].map((offset) => new Date(1700000000000 + offset));
    const now = () => (timestamps.shift() ?? new Date(1700000000000 + 7000));
    const counters = { firebase: 0, db: 0 };

    const app = express();
    app.use(
      createHealthRouter({
        serviceName: "api",
        cacheTtlMs: 5000,
        now,
        dependencyChecks: {
          firebase: async () => {
            counters.firebase += 1;
            return "ok";
          },
          db: async () => {
            counters.db += 1;
            return "ok";
          },
        },
      }),
    );

    await request(app).get("/health");
    await request(app).get("/health");
    expect(counters).toEqual({ firebase: 1, db: 1 });

    await request(app).get("/health");
    expect(counters).toEqual({ firebase: 2, db: 2 });
  });
});
