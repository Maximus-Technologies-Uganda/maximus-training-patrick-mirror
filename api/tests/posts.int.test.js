jest.mock('nanoid', () => {
  let counter = 0;
  const gen = () => `test-id-${++counter}`;
  return { nanoid: gen };
});
const request = require('supertest');
const { createApp } = require('../src/app');
const { validToken } = require('./jwt.util.js');
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
const cookie = (u) => `session=${validToken(u)}`;
const { loadConfigFromEnv } = require('../src/config');
const { createRepository } = require('../src/repositories/posts-repository');

function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = createRepository();
  return createApp(config, repository);
}

describe('POST /posts', () => {
  it('creates a post and returns 201 with Location header', async () => {
    const app = makeApp();
    const payload = { title: 'Hello World', content: 'First post content' };

    const res = await request(app)
      .post('/posts')
      .set('Cookie', cookie('user-A'))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
    expect(res.headers.location).toBe(`/posts/${res.body.id}`);
    expect(res.body).toEqual({
      id: expect.any(String),
      title: payload.title,
      content: payload.content,
      ownerId: 'user-A',
      tags: expect.any(Array),
      published: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  it('returns 400 when required fields are missing', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/posts')
      .set('Cookie', cookie('user-A'))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'validation_error' });
  });

  it('rejects unknown fields with 400', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/posts')
      .set('Cookie', cookie('user-A'))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'T', content: 'C', extra: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'validation_error' });
  });
});

describe('GET /posts', () => {
  it('returns a list including previously created posts', async () => {
    const app = makeApp();

    const p1 = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'A', content: 'aaa' });
    const p2 = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'B', content: 'bbb' });

    expect(p1.status).toBe(201);
    expect(p2.status).toBe(201);

    const res = await request(app).get('/posts');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.page).toBe('number');
    expect(typeof res.body.pageSize).toBe('number');
    expect(typeof res.body.hasNextPage).toBe('boolean');

    const ids = res.body.items.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining([p1.body.id, p2.body.id]));
  });

  it('supports pagination parameters', async () => {
    const app = makeApp();

    await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'A', content: 'aaa' });
    await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'B', content: 'bbb' });

    const res = await request(app).get('/posts?page=1&pageSize=1');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(1);
    expect(res.body.items.length).toBe(1);
    expect(typeof res.body.hasNextPage).toBe('boolean');
  });

  it('paginates across pages and sets hasNextPage correctly', async () => {
    const app = makeApp();
    // create 5 posts
    for (let i = 0; i < 5; i++) {
      const r = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T' + i, content: 'C' + i });
      expect(r.status).toBe(201);
    }
    const p1 = await request(app).get('/posts?page=1&pageSize=2');
    expect(p1.status).toBe(200);
    expect(p1.body.items.length).toBe(2);
    expect(p1.body.hasNextPage).toBe(true);
    const p2 = await request(app).get('/posts?page=2&pageSize=2');
    expect(p2.status).toBe(200);
    expect(p2.body.items.length).toBe(2);
    expect(p2.body.hasNextPage).toBe(true);
    const p3 = await request(app).get('/posts?page=3&pageSize=2');
    expect(p3.status).toBe(200);
    expect(p3.body.items.length).toBe(1);
    expect(p3.body.hasNextPage).toBe(false);
  });

  it('enforces page/pageSize bounds with 400 errors', async () => {
    const app = makeApp();
    const r1 = await request(app).get('/posts?page=0');
    expect(r1.status).toBe(400);
    expect(r1.body).toMatchObject({ code: 'validation_error' });
    const r2 = await request(app).get('/posts?pageSize=0');
    expect(r2.status).toBe(400);
    const r3 = await request(app).get('/posts?pageSize=101');
    expect(r3.status).toBe(400);
  });
});

describe('PUT /posts and PATCH /posts/:id', () => {
  it('PUT replaces the entire post and returns 200', async () => {
    const app = makeApp();
    const created = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T', content: 'C' });
    expect(created.status).toBe(201);
    const putRes = await request(app)
      .put(`/posts/${created.body.id}`)
      .set('Cookie', cookie('user-A'))
      .set('Accept', 'application/json')
      .send({ title: 'New', content: 'NewC' });
    expect(putRes.status).toBe(200);
    expect(putRes.body).toMatchObject({
      id: created.body.id,
      title: 'New',
      content: 'NewC',
      tags: [],
      published: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  it('PUT returns 404 when id is missing', async () => {
    const app = makeApp();
    const res = await request(app).put('/posts/missing').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T', content: 'C' });
    expect(res.status).toBe(404);
  });

  it('PUT returns 400 on invalid body', async () => {
    const app = makeApp();
    const created = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T', content: 'C' });
    expect(created.status).toBe(201);
    const res = await request(app).put(`/posts/${created.body.id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'validation_error' });
  });

  it('PATCH updates subset of fields and returns 200', async () => {
    const app = makeApp();
    const created = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T', content: 'C' });
    const res = await request(app).patch(`/posts/${created.body.id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T2' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: 'T2', content: 'C' });
  });

  it('PATCH returns 404 when id is missing', async () => {
    const app = makeApp();
    const res = await request(app).patch('/posts/missing').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('PATCH returns 400 when body is empty or invalid', async () => {
    const app = makeApp();
    const created = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'T', content: 'C' });
    const resEmpty = await request(app).patch(`/posts/${created.body.id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({});
    expect(resEmpty.status).toBe(400);
    const resInvalid = await request(app).patch(`/posts/${created.body.id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: '' });
    expect(resInvalid.status).toBe(400);
  });
});

