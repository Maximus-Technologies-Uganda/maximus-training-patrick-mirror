import { createHmac } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import type { IPostsRepository } from "../../src/repositories/posts.repository";
import { createRepository } from "../../src/repositories/posts-repository";

const TEST_SESSION_SECRET = process.env.SESSION_SECRET || "test-secret";
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

type MakeAppOptions = {
  rateLimitMax?: number;
  repository?: IPostsRepository;
};

async function makeApp(options: MakeAppOptions = {}) {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: options.rateLimitMax ?? 3 };
  const repository = options.repository ?? (await createRepository());
  const app = createApp(config, repository);
  return { app, repository };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeSessionCookie(userId: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ userId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 })
  );
  const signature = createHmac("sha256", TEST_SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest();
  const encodedSignature = base64url(signature);
  return `session=${header}.${payload}.${encodedSignature}`;
}

function buildRepository(overrides: Partial<IPostsRepository>): IPostsRepository {
  const notImplemented = async () => {
    throw new Error("Not implemented in test stub");
  };

  return {
    create: overrides.create ?? (async (_post) => notImplemented()),
    getById: overrides.getById ?? (async (_id) => notImplemented()),
    list: overrides.list ?? (async (_page, _pageSize) => notImplemented()),
    replace: overrides.replace ?? (async (_id, _post) => false),
    update: overrides.update ?? (async (_id, _partial) => null),
    delete: overrides.delete ?? (async (_id) => false),
    count: overrides.count ?? (async () => 0),
  };
}

describe('Error Cache-Control headers (T087)', () => {
  it('sets Cache-Control: no-store on 401 responses', async () => {
    const { app } = await makeApp();
    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'x', content: 'y' });
    expect(res.status).toBe(401);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets Cache-Control: no-store on 429 responses, and omits on 200', async () => {
    const { app } = await makeApp();
    // consume allowed requests on /posts endpoint (which has rate limiting)
    await request(app).get('/posts');
    await request(app).get('/posts');
    await request(app).get('/posts');
    const res = await request(app).get('/posts');
    expect(res.status).toBe(429);
    expect(res.headers['cache-control']).toBe('no-store');

    // Use a fresh app instance to avoid limiter spillover
    const { app: app2 } = await makeApp();
    const ok = await request(app2).get('/');
    expect(ok.status).toBe(200);
    // ok responses may or may not have Cache-Control explicitly set; ensure not 'no-store'
    if (ok.headers['cache-control']) {
      expect(ok.headers['cache-control']).not.toBe('no-store');
    }
  });

  it('sets Cache-Control: no-store on 403 responses', async () => {
    const { app, repository } = await makeApp({ rateLimitMax: 1000 });
    const post = await repository.create({
      ownerId: 'owner-123',
      title: 'Owned',
      content: 'Content owned by user',
      tags: [],
      published: false,
    });

    const res = await request(app)
      .patch(`/posts/${post.id}`)
      .set('Cookie', makeSessionCookie('other-user'))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'Updated' });

    expect(res.status).toBe(403);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets Cache-Control: no-store on 422 responses emitted via errors', async () => {
    const repository = buildRepository({
      create: async () => {
        const error = new Error('validation failed');
        (error as Error & { status?: number }).status = 422;
        throw error;
      },
    });
    const { app } = await makeApp({ repository, rateLimitMax: 1000 });

    const res = await request(app)
      .post('/posts')
      .set('Cookie', makeSessionCookie('user-1'))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'Valid', content: 'Body content with enough length' });

    expect(res.status).toBe(422);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets Cache-Control: no-store on 413 payload too large responses', async () => {
    const { app } = await makeApp({ rateLimitMax: 1000 });
    const oversized = 'x'.repeat(300 * 1024);

    const res = await request(app)
      .post('/posts')
      .set('Cookie', makeSessionCookie('user-1'))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'Big', content: oversized });

    expect(res.status).toBe(413);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets Cache-Control: no-store on 503 responses from downstream failures', async () => {
    const repository = buildRepository({
      list: async () => {
        const error = new Error('service unavailable');
        (error as Error & { status?: number }).status = 503;
        throw error;
      },
    });
    const { app } = await makeApp({ repository, rateLimitMax: 1000 });

    const res = await request(app).get('/posts');

    expect(res.status).toBe(503);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
