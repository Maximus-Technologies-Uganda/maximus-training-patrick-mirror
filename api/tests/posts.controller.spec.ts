/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPostsController } from '../src/core/posts/posts.controller';

describe('posts.controller', () => {
  function makeRes() {
    const store: any = { statusCode: 0, body: null, headers: {}, location: '' };
    const res: any = {
      status: (c: number) => { store.statusCode = c; return res; },
      json: (b: any) => { store.body = b; return res; },
      location: (l: string) => { store.location = l; return res; },
      send: (b?: any) => { store.body = b ?? null; return res; },
      setHeader: () => res,
      get __store() { return store; }
    };
    return res;
  }
  const next = jest.fn();

  it('list returns normalized pagination output', async () => {
    const res = makeRes();
    const svc = {
      list: jest.fn(async () => ({ items: [], totalItems: 0, totalPages: 0, currentPage: 1, hasNextPage: false, pageSize: 10 })),
    } as any;
    const ctl = createPostsController(svc);
    await ctl.list({ query: { page: '2', pageSize: '5' } } as any, res as any, next);
    expect(res.__store.statusCode).toBe(200);
    expect(res.__store.body.currentPage).toBe(1);
    expect(svc.list).toHaveBeenCalledWith({ page: 2, pageSize: 5 });
  });

  it('create returns 401 when no user', async () => {
    const res = makeRes();
    const svc = { create: jest.fn() } as any;
    const ctl = createPostsController(svc);
    await ctl.create({ body: { title: 'T' } } as any, res as any, next);
    expect(res.__store.statusCode).toBe(401);
  });

  it('create returns 201 when user present', async () => {
    const res = makeRes();
    const svc = { create: jest.fn(async (p) => ({ id: 'x1', ...p })) } as any;
    const ctl = createPostsController(svc);
    await ctl.create({ body: { title: 'T' }, user: { userId: 'u1' } } as any, res as any, next);
    expect(res.__store.statusCode).toBe(201);
    expect(res.__store.location).toBe('/posts/x1');
  });
});
