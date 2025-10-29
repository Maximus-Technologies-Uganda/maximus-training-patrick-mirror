import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { InMemoryPostsRepository } from "../../src/repositories/posts.repository";

class ThrowingRepository extends InMemoryPostsRepository {
  async count(): Promise<number> {
    throw new Error("db offline");
  }
}

describe("Contract: GET /health", () => {
  function buildApp(repository = new InMemoryPostsRepository()) {
    const config = loadConfigFromEnv();
    return createApp(config, repository);
  }

  it("returns service metadata, tracing headers, and healthy dependency states", async () => {
    const app = buildApp();
    const response = await request(app).get("/health").set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.headers.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
    expect(response.body.service).toBe("api");
    expect(response.body.status).toBe("ok");
    expect(response.body.dependencies).toMatchObject({ firebase: "ok", db: "ok" });
    expect(typeof response.body.time).toBe("string");
    expect(typeof response.body.uptime_s).toBe("number");
  });

  it("echoes upstream tracing context when provided", async () => {
    const app = buildApp();
    const response = await request(app)
      .get("/health")
      .set("Accept", "application/json")
      .set("X-Request-Id", "client-health-123")
      .set("traceparent", "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01")
      .set("tracestate", "vendor=foo");

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe("client-health-123");
    expect(response.headers.traceparent).toBe("00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01");
    expect(response.headers.tracestate).toBe("vendor=foo");
    expect(response.body.requestId).toBe("client-health-123");
    expect(response.body.traceId).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("reports degraded status when a dependency fails", async () => {
    const app = buildApp(new ThrowingRepository());
    const response = await request(app).get("/health").set("Accept", "application/json");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("degraded");
    expect(response.body.dependencies.db).toBe("down");
    expect(response.body.dependencies.details.db).toContain("db offline");
  });
});
