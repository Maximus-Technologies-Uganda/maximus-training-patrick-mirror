import express from "express";
import request from "supertest";
import { createHealthRouter, type DependencyChecker } from "../src/routes/health";

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
});
