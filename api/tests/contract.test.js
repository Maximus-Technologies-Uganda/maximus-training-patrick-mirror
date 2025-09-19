jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
const path = require('path');
const request = require('supertest');
const jestOpenAPI = require('jest-openapi').default || require('jest-openapi');

const { createApp } = require('../src/app');
const { loadConfigFromEnv } = require('../src/config');
const { createRepository } = require('../src/repositories/posts-repository');

function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = createRepository();
  return createApp(config, repository);
}

beforeAll(() => {
  const specPath = path.join(__dirname, '..', '..', 'specs', '002-posts-api', 'contracts', 'openapi.yml');
  jestOpenAPI(specPath);
});

describe('OpenAPI contract - /health', () => {
  it('GET /health matches spec', async () => {
    const app = makeApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res).toSatisfyApiSpec();
  });
});

describe('OpenAPI contract - /posts', () => {
  it('POST /posts success matches spec', async () => {
    const app = makeApp();
    const res = await request(app).post('/posts').send({ title: 'T', content: 'C' });
    expect(res.status).toBe(201);
    expect(res).toSatisfyApiSpec();
    expect(res.headers.location).toBe(`/posts/${res.body.id}`);
  });

  it('POST /posts validation error matches spec', async () => {
    const app = makeApp();
    const res = await request(app).post('/posts').send({});
    expect(res.status).toBe(400);
    expect(res).toSatisfyApiSpec();
  });

  it('GET /posts list matches spec', async () => {
    const app = makeApp();
    await request(app).post('/posts').send({ title: 'A', content: 'aaa' });
    const res = await request(app).get('/posts');
    expect(res.status).toBe(200);
    expect(res).toSatisfyApiSpec();
  });
});

describe('OpenAPI contract - /posts/{id}', () => {
  it('GET /posts/:id not found matches spec', async () => {
    const app = makeApp();
    const res = await request(app).get('/posts/missing');
    expect(res.status).toBe(404);
    expect(res).toSatisfyApiSpec();
  });

  it('GET /posts/:id success matches spec', async () => {
    const app = makeApp();
    const created = await request(app).post('/posts').send({ title: 'Hello', content: 'World' });
    const res = await request(app).get(`/posts/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res).toSatisfyApiSpec();
  });

  it('PUT /posts/:id success matches spec', async () => {
    const app = makeApp();
    await request(app).post('/posts').send({ title: 'Hello', content: 'World' });
    const res = await request(app).put('/posts/test-id').send({ title: 'New', content: 'Text' });
    expect(res.status).toBe(200);
    expect(res).toSatisfyApiSpec();
  });

  it('PATCH /posts/:id validation error matches spec', async () => {
    const app = makeApp();
    const res = await request(app).patch('/posts/test-id').send({});
    expect(res.status).toBe(400);
    expect(res).toSatisfyApiSpec();
  });

  it('PATCH /posts/:id success matches spec', async () => {
    const app = makeApp();
    await request(app).post('/posts').send({ title: 'Hello', content: 'World' });
    const res = await request(app).patch('/posts/test-id').send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res).toSatisfyApiSpec();
  });

  it('DELETE /posts/:id success matches spec', async () => {
    const app = makeApp();
    await request(app).post('/posts').send({ title: 'Hello', content: 'World' });
    const res = await request(app).delete('/posts/test-id');
    expect(res.status).toBe(204);
    // No body expected for 204
  });

  it('DELETE /posts/:id not found matches spec', async () => {
    const app = makeApp();
    const res = await request(app).delete('/posts/missing');
    expect(res.status).toBe(404);
    expect(res).toSatisfyApiSpec();
  });
});


