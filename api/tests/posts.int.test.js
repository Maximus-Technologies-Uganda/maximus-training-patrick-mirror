jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
const request = require('supertest');
const { createApp } = require('../src/app');
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
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
    expect(res.headers.location).toBe(`/posts/${res.body.id}`);
    expect(res.body).toEqual({
      id: expect.any(String),
      title: payload.title,
      content: payload.content,
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
      .send({})
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'validation_error' });
  });
});

describe('GET /posts', () => {
  it('returns a list including previously created posts', async () => {
    const app = makeApp();

    const p1 = await request(app).post('/posts').send({ title: 'A', content: 'aaa' });
    const p2 = await request(app).post('/posts').send({ title: 'B', content: 'bbb' });

    expect(p1.status).toBe(201);
    expect(p2.status).toBe(201);

    const res = await request(app).get('/posts');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      page: 1,
      pageSize: 20,
      hasNextPage: false,
      items: expect.any(Array)
    });

    const ids = res.body.items.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining([p1.body.id, p2.body.id]));
  });

  it('supports pagination parameters', async () => {
    const app = makeApp();

    await request(app).post('/posts').send({ title: 'A', content: 'aaa' });
    await request(app).post('/posts').send({ title: 'B', content: 'bbb' });

    const res = await request(app).get('/posts?page=1&pageSize=1');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(1);
    expect(res.body.items.length).toBe(1);
    expect(typeof res.body.hasNextPage).toBe('boolean');
  });
});


