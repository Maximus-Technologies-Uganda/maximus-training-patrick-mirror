import request from "supertest";
import { createApp } from "#tsApp";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe("logging integration", () => {
  const originalLog = console.log;
  let logs: string[];

  beforeEach(() => {
    logs = [];
    // eslint-disable-next-line no-console
    console.log = (msg?: unknown) => {
      if (typeof msg === "string") logs.push(msg);
      else logs.push(String(msg));
    };
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.log = originalLog;
  });

  it("emits structured JSON with request metadata for /health", async () => {
    const app = await makeApp();
    const testId = "test-req-id-123";

    const res = await request(app).get("/health").set("X-Request-Id", testId).set("traceparent", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
    expect(res.status).toBeLessThan(600);

    const parsed = logs
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((value): value is Record<string, unknown> => value != null)[0];

    expect(parsed).toBeTruthy();
    expect(parsed?.level).toBe("info");
    expect(parsed?.message).toBe("request completed");
    expect(parsed?.method).toBe("GET");
    expect(parsed?.path).toBe("/health");
    expect(parsed?.status).toBe(200);
    expect(parsed?.requestId).toBe(testId);
    expect(parsed?.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(typeof parsed?.latencyMs).toBe("number");
    expect(parsed?.component).toBe("api");
    expect(parsed?.rateLimit).toBeDefined();
    expect(parsed?.rateLimit).toMatchObject({
      limit: expect.any(Number),
      remaining: expect.any(Number),
    });
  });
});
