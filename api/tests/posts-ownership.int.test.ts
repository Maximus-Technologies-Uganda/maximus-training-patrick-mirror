import request from "supertest";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validToken } = require('./jwt.util.js');
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
const cookieForUser = (userId: string): string => `session=${validToken(userId)}`;
import { createApp } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}


describe("Posts Ownership Rules", () => {
  it("Create sets ownerId from authenticated user", async () => {
    const api = await makeApp();
    const userA = cookieForUser("user-A");

    const createRes = await request(api)
      .post("/posts")
      .set("Cookie", [userA])
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "Owned by A", content: "Post content" });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id as string;

    const getRes = await request(api).get(`/posts/${id}`);
    expect(getRes.status).toBe(200);
    // Should include ownerId set by server from session
    expect(getRes.body).toHaveProperty("ownerId", "user-A");
  });

  it("Update/Delete forbidden (403) for non-owner", async () => {
    const api = await makeApp();
    const userA = cookieForUser("user-A");
    const userB = cookieForUser("user-B");

    const createRes = await request(api)
      .post("/posts")
      .set("Cookie", [userA])
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "A's post", content: "Secret" });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id as string;

    const patchRes = await request(api)
      .patch(`/posts/${id}`)
      .set("Cookie", [userB])
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "Hacked" });
    expect(patchRes.status).toBe(403);

    const deleteRes = await request(api)
      .delete(`/posts/${id}`)
      .set("Cookie", [userB])
      .set("Accept", "application/json");
    expect(deleteRes.status).toBe(403);
  });

  it("Update/Delete succeeds for owner", async () => {
    const api = await makeApp();
    const userA = cookieForUser("user-A");

    const createRes = await request(api)
      .post("/posts")
      .set("Cookie", [userA])
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ title: "A's post", content: "Original" });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id as string;

    const patchRes = await request(api)
      .patch(`/posts/${id}`)
      .set("Cookie", [userA])
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ content: "Updated by owner" });
    expect(patchRes.status).toBeGreaterThanOrEqual(200);
    expect(patchRes.status).toBeLessThan(300);

    const deleteRes = await request(api)
      .delete(`/posts/${id}`)
      .set("Cookie", [userA])
      .set("Accept", "application/json");
    expect(deleteRes.status).toBe(204);
  });

  it("Not Found (404) for non-existent post on update/delete", async () => {
    const api = await makeApp();
    const userA = cookieForUser("user-A");

    const patchMissing = await request(api)
      .patch("/posts/does-not-exist")
      .set("Cookie", [userA])
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({ content: "irrelevant" });
    expect(patchMissing.status).toBe(404);

    const deleteMissing = await request(api)
      .delete("/posts/does-not-exist")
      .set("Cookie", [userA])
      .set("Accept", "application/json");
    expect(deleteMissing.status).toBe(404);
  });
});


