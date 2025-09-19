const { InMemoryPostsRepository } = require('../src/repositories/posts-repository');

describe('InMemoryPostsRepository', () => {
  let repo;
  beforeEach(() => {
    repo = new InMemoryPostsRepository();
  });

  it('returns null for getById on missing id', async () => {
    await expect(repo.getById('none')).resolves.toBeNull();
  });

  it('count is 0 on empty dataset', async () => {
    await expect(repo.count()).resolves.toBe(0);
  });

  it('list returns empty array on empty dataset and out-of-range pages', async () => {
    const r1 = await repo.list(1, 10);
    expect(r1).toEqual([]);
    // populate one item
    const now = new Date().toISOString();
    await repo.create({ id: 'p1', title: 't', content: 'c', tags: [], published: false, createdAt: now, updatedAt: now });
    const r2 = await repo.list(2, 10);
    expect(r2).toEqual([]);
  });

  it('replace returns false for missing id', async () => {
    const ok = await repo.replace('none', { id: 'none' });
    expect(ok).toBe(false);
  });

  it('update returns null for missing id', async () => {
    const updated = await repo.update('none', { title: 'x' });
    expect(updated).toBeNull();
  });

  it('delete returns false for missing id', async () => {
    const ok = await repo.delete('none');
    expect(ok).toBe(false);
  });

  it('orders by createdAt descending and paginates', async () => {
    const base = new Date('2024-01-01T00:00:00.000Z').getTime();
    const mk = (id, t) => ({ id, title: id, content: 'c', tags: [], published: false, createdAt: t, updatedAt: t });
    for (let i = 0; i < 5; i++) {
      const iso = new Date(base + i * 1000).toISOString();
      await repo.create(mk('p' + i, iso));
    }
    const page1 = await repo.list(1, 2);
    expect(page1.map(p => p.id)).toEqual(['p4', 'p3']);
    const page2 = await repo.list(2, 2);
    expect(page2.map(p => p.id)).toEqual(['p2', 'p1']);
    const page3 = await repo.list(3, 2);
    expect(page3.map(p => p.id)).toEqual(['p0']);
  });
});


