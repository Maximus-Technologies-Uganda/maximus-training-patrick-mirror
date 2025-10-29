import request from "supertest";
import { createApp } from "#tsApp";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";
import { createObservabilityLogger } from "../src/logging/observability";

describe("logging redaction end-to-end", () => {
  const originalLog = console.log;
  let logs: string[];

  async function makeApp() {
    const base = loadConfigFromEnv();
    const config = { ...base, rateLimitMax: 1000 };
    const repository = await createRepository();
    return createApp(config, repository);
  }

  beforeEach(() => {
    logs = [];
    // eslint-disable-next-line no-console
    console.log = (message?: unknown) => {
      if (typeof message === "string") logs.push(message);
      else logs.push(String(message));
    };
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.log = originalLog;
  });

  it("does not leak emails, bearer tokens, or passwords to stdout", async () => {
    const app = await makeApp();
    const requestId = "pii-redaction-e2e";

    const res = await request(app)
      .post("/auth/login")
      .set("X-Request-Id", requestId)
      .set("Authorization", "Bearer secret-token-value")
      .send({ username: "alice", password: "correct-password", email: "alice@example.com" });

    expect(res.status).toBe(204);

    const aggregated = logs.join("\n");
    expect(aggregated).not.toContain("correct-password");
    expect(aggregated).not.toContain("secret-token-value");
    expect(aggregated).not.toContain("alice@example.com");
  });

  it("scrubs JWT payloads from structured log entries", () => {
    const jwtSample =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
      "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const captured: string[] = [];
    const logger = createObservabilityLogger({
      writer: (line) => {
        captured.push(line);
      },
    });

    logger.info("jwt sample", {
      metadata: { token: jwtSample, authorization: `Bearer ${jwtSample}` },
    });

    const serialized = captured.join("\n");
    expect(serialized).not.toContain(jwtSample);
    expect(serialized).toContain("[REDACTED]");
  });
});
