import request from "supertest";
import type { Express } from "express";

export async function loginAndGetCsrfCookie(app: Express): Promise<{ agent: request.SuperTest<request.Test>; csrf: string }> {
  const agent = request.agent(app);
  await agent.post("/auth/login").set("Accept", "application/json").send({ username: "alice", password: "correct-password" }).expect(204);
  // Fetch root to harvest cookies reliably
  const res = await agent.get("/").expect(200);
  const setCookies: string[] = ([] as string[]).concat(res.headers["set-cookie"] || []);
  const csrfCookie = setCookies.find((c) => c.startsWith("csrf=")) || "csrf=";
  const csrf = decodeURIComponent(csrfCookie.split(";")[0].split("=")[1] || "");
  return { agent, csrf };
}


