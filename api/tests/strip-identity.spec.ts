import request from "supertest";
// Support JS util for JWT
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

describe('Strip identity fields (T104)', () => {
  beforeAll(() => { process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret'; });
  it('removes userId/role/authorId from request bodies', async () => {
    const app = await makeApp();
    const cookie = `session=${validToken('user-A')}`;
    const res = await request(app)
      .post('/posts')
      .set('Cookie', [cookie])
      .set('X-User-Id', 'user-A')
      .set('X-User-Role', 'owner')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'T', content: 'C', userId: 'bad', role: 'admin', authorId: 'evil' });

    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBeDefined();
    // Ensure server did not echo client-supplied identity fields
    expect(res.body.userId).toBeUndefined();
    expect(res.body.role).toBeUndefined();
    expect(res.body.authorId).toBeUndefined();
  });
});
