import request from "supertest";
// Support both TS and JS util depending on runner
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwtUtil = require('./jwt.util.js');
const { validToken } = jwtUtil;
import { createApp } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe("Auth middleware on protected CUD route (POST /posts)", () => {
  const body = { title: "test", content: "test" };
  beforeAll(() => { process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-secret"; });

  it("returns 401 for invalid/tampered cookie", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/posts")
      .set("Cookie", ["session=invalid.tampered.payload"]) // bad signature / format
      .send(body)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(401);
  });

  it("returns 401 for expired cookie", async () => {
    const app = await makeApp();
    const expiredCookie = `session=${validToken("user-A", -60)}`;
    const res = await request(app)
      .post("/posts")
      .set("Cookie", [expiredCookie])
      .send(body)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(401);
  });

  it("returns 401 when no session cookie is provided", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/posts")
      .send(body)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(401);
  });

  it("returns 201 for a valid, non-expired cookie", async () => {
    const app = await makeApp();
    const validCookie = `session=${validToken("user-A")}`;
    const res = await request(app)
      .post("/posts")
      .set("Cookie", [validCookie])
      .send(body)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(201);
  });
});


