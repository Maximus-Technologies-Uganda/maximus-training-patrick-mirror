import request from "supertest";
import { app } from "../src/server";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
import { validToken } from "./jwt.util";

describe("CSRF middleware", () => {
  it("rejects POST without CSRF token", async () => {
    // Authenticated but missing CSRF header/cookie → 403
    const res = await request(app)
      .post("/posts")
      .set("Origin", "http://localhost:3001")
      .set("Cookie", `session=${validToken("user-A")}`)
      .set("Accept", "application/json")
      .send({ title: "t", content: "c" });
    expect(res.status).toBe(403);
    expect(res.body?.code || res.text).toBeTruthy();
  });

  it("accepts POST with matching CSRF cookie and header", async () => {
    const agent = request.agent(app);
    // First, perform login to receive CSRF cookie (fallback path)
    await agent.post("/auth/login").set("Accept", "application/json").send({ username: "alice", password: "correct-password" }).expect(204);
    const loginRes = await agent.get("/").expect(200);
    const cookies = (loginRes.headers["set-cookie"] || []) as string[];
    const csrfCookie = (cookies.find((c) => c.startsWith("csrf=")) || "csrf=").split(";")[0].split("=")[1];
    const res = await agent
      .post("/posts")
      .set("X-CSRF-Token", decodeURIComponent(csrfCookie))
      .send({ title: "hello", content: "world" });
    // Either created or validation error depending on schemas, but not 403
    expect(res.status).not.toBe(403);
  });
});


