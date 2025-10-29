import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe("Error envelope includes requestId or traceId (T111)", () => {
  it("401 unauthorized includes at least one of requestId/traceId", async () => {
    const app = await makeApp();
    // Trigger 401 by calling a protected route without session
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "x", body: "y" });
    expect(res.status).toBe(401);
    const body = res.body as { requestId?: string; traceId?: string };
    expect(body).toBeDefined();
    expect(typeof body).toBe("object");
    expect(Boolean(body.requestId) || Boolean(body.traceId)).toBe(true);
  });

  it("includes both requestId and traceId when both headers provided", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/posts")
      .set("X-Request-Id", "req-test-123")
      .set("traceparent", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "x", body: "y" });

    expect(res.status).toBe(401);
    const body = res.body as { requestId?: string; traceId?: string; code?: string };
    expect(body.requestId).toBeDefined();
    expect(body.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("extracts traceId from W3C traceparent header", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/posts")
      .set("traceparent", "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "x", body: "y" });

    expect(res.status).toBe(401);
    const body = res.body as { requestId?: string; traceId?: string };
    expect(body.traceId).toBe("0af7651916cd43dd8448eb211c80319c");
  });

  it("uses x-trace-id header when traceparent not present", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/posts")
      .set("x-trace-id", "custom-trace-id-abc123")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "x", body: "y" });

    expect(res.status).toBe(401);
    const body = res.body as { requestId?: string; traceId?: string };
    expect(body.traceId).toBe("custom-trace-id-abc123");
  });

  // 5xx path is covered in API integration suites where routes exist before error handler
});
