import { PostsService } from '../src/core/posts/posts.service';

// Minimal mock of repository-backed domain service is exercised indirectly

describe('PostsService adapter', () => {
  it('creates a post and lists it with pagination', async () => {
    const svc = new PostsService();
    const created = await svc.create({ title: 'T', content: 'C', ownerId: 'u1', tags: [], published: true });
    expect(created.id).toBeTruthy();

    const page1 = await svc.list({ page: 1, pageSize: 1 });
    expect(page1.items.length).toBe(1);
    expect(page1.totalItems).toBeGreaterThanOrEqual(1);
    expect(page1.currentPage).toBe(1);

    const fetched = await svc.getById(created.id);
    expect(fetched && fetched.id).toBe(created.id);

    const replaced = await svc.replace(created.id, { title: 'T2', content: 'C2', tags: [], published: true });
    expect(replaced && replaced.title).toBe('T2');

    const updated = await svc.update(created.id, { title: 'T3' });
    expect(updated && updated.title).toBe('T3');

    const ok = await svc.delete(created.id);
    expect(ok).toBe(true);
  });
});
