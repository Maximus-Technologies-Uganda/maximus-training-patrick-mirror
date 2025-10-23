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

describe("POST /auth/login", () => {
  it("returns 204 and sets an HttpOnly session cookie for valid credentials", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ username: "alice", password: "correct-password" });

    expect(res.status).toBe(204);
    const setCookie = res.headers["set-cookie"] as string[] | undefined;
    expect(Array.isArray(setCookie) && setCookie.length > 0).toBe(true);
    expect(setCookie![0]).toMatch(/HttpOnly/i);
    expect(res.text).toBe("");
  });

  it("returns 401 and does not set a cookie for invalid credentials", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ username: "alice", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});


describe("POST /auth/logout", () => {
  it("returns 204, clears HttpOnly session cookie, and is idempotent without a session", async () => {
    const app = await makeApp();

    // First call without any session cookie
    const res1 = await request(app)
      .post("/auth/logout")
      .set("Accept", "application/json");
    expect(res1.status).toBe(204);
    const setCookie1 = res1.headers["set-cookie"] as string[] | undefined;
    expect(Array.isArray(setCookie1) && setCookie1.length > 0).toBe(true);
    const cookieStr = setCookie1![0];
    expect(cookieStr).toMatch(/HttpOnly/i);
    expect(cookieStr).toMatch(/(Max-Age=0|Expires=)/i);
    expect(res1.text).toBe("");

    // Second call (still without a session): remains successful
    const res2 = await request(app)
      .post("/auth/logout")
      .set("Accept", "application/json");
    expect(res2.status).toBe(204);
  });
});


