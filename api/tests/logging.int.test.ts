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

  it("emits structured JSON with required fields for /health", async () => {
    const app = await makeApp();
    const testId = "test-req-id-123";

    const res = await request(app).get("/health").set("X-Request-Id", testId);
    expect(res.status).toBe(200);

    // Find the first valid JSON log line
    const parsed = logs
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter((v): v is Record<string, unknown> => v != null)[0];

    expect(parsed).toBeTruthy();
    expect(parsed?.level).toBe("info");
    expect(parsed?.message).toBe("request completed");
    expect(parsed?.method).toBe("GET");
    expect(parsed?.path).toBe("/health");
    expect(parsed?.status).toBe(200);
    expect(parsed?.requestId).toBe(testId);
  });
});


