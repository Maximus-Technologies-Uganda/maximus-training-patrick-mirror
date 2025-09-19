jest.mock('nanoid', () => ({ nanoid: () => 'fixed-id' }));

const { PostsService } = require('../src/services/posts-service');
const { InMemoryPostsRepository } = require('../src/repositories/posts-repository');

describe('PostsService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new InMemoryPostsRepository();
    service = new PostsService(repo);
  });

  describe('create', () => {
    it('creates a post with defaults and timestamps', async () => {
      const created = await service.create({ title: 'T', content: 'C' });
      expect(created).toEqual({
        id: 'fixed-id',
        title: 'T',
        content: 'C',
        tags: [],
        published: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      const fetched = await repo.getById('fixed-id');
      expect(fetched).toMatchObject({ id: 'fixed-id', title: 'T', content: 'C' });
    });

    it('respects provided optional fields', async () => {
      const created = await service.create({ title: 'T', content: 'C', tags: ['x'], published: true });
      expect(created.tags).toEqual(['x']);
      expect(created.published).toBe(true);
    });
  });

  describe('getById', () => {
    it('returns an existing post', async () => {
      const now = new Date().toISOString();
      const post = { id: 'p1', title: 'T', content: 'C', tags: [], published: false, createdAt: now, updatedAt: now };
      await repo.create(post);
      const fetched = await service.getById('p1');
      expect(fetched).toEqual(post);
    });

    it('throws not_found for missing id', async () => {
      await expect(service.getById('missing')).rejects.toMatchObject({ code: 'not_found' });
    });
  });

  describe('list pagination and hasNextPage', () => {
    function makePost(id, createdAt) {
      return { id, title: id, content: 'C', tags: [], published: false, createdAt, updatedAt: createdAt };
    }

    it('computes hasNextPage correctly when there is a next page', async () => {
      // total 5, pageSize 2 => page 1 has next, page 2 has next, page 3 no next
      const base = new Date('2024-01-01T00:00:00.000Z').getTime();
      for (let i = 0; i < 5; i++) {
        const t = new Date(base + i * 1000).toISOString();
        await repo.create(makePost('p' + i, t));
      }
      const r1 = await service.list(1, 2);
      expect(r1.items).toHaveLength(2);
      expect(r1.hasNextPage).toBe(true);
      const r2 = await service.list(2, 2);
      expect(r2.items).toHaveLength(2);
      expect(r2.hasNextPage).toBe(true);
      const r3 = await service.list(3, 2);
      expect(r3.items).toHaveLength(1);
      expect(r3.hasNextPage).toBe(false);
    });

    it('hasNextPage is false for empty dataset', async () => {
      const r = await service.list(1, 10);
      expect(r.items).toEqual([]);
      expect(r.hasNextPage).toBe(false);
    });
  });

  describe('replace', () => {
    it('replaces fields, preserves id/createdAt, updates updatedAt, applies defaults', async () => {
      const created = await service.create({ title: 'Old', content: 'OldC', tags: ['a'], published: true });
      // Ensure timestamp difference
      await new Promise(r => setTimeout(r, 5));
      const updated = await service.replace(created.id, { title: 'New', content: 'NewC' });
      expect(updated).toEqual({
        id: created.id,
        title: 'New',
        content: 'NewC',
        tags: [],
        published: false,
        createdAt: created.createdAt,
        updatedAt: expect.any(String)
      });
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('throws not_found when id does not exist', async () => {
      await expect(service.replace('nope', { title: 'T', content: 'C' })).rejects.toMatchObject({ code: 'not_found' });
    });
  });

  describe('update (merge behavior)', () => {
    it('merges provided fields and updates updatedAt only', async () => {
      const created = await service.create({ title: 'T', content: 'C' });
      await new Promise(r => setTimeout(r, 5));
      const merged = await service.update(created.id, { title: 'T2' });
      expect(merged).toMatchObject({ id: created.id, title: 'T2', content: 'C' });
      expect(merged.updatedAt).not.toBe(created.updatedAt);
      expect(merged.createdAt).toBe(created.createdAt);
    });

    it('throws not_found when id does not exist', async () => {
      await expect(service.update('missing', { title: 'X' })).rejects.toMatchObject({ code: 'not_found' });
    });
  });

  describe('delete', () => {
    it('deletes an existing post', async () => {
      const created = await service.create({ title: 'T', content: 'C' });
      await expect(service.delete(created.id)).resolves.toBeUndefined();
      await expect(service.getById(created.id)).rejects.toMatchObject({ code: 'not_found' });
    });

    it('throws not_found when deleting missing id', async () => {
      await expect(service.delete('nope')).rejects.toMatchObject({ code: 'not_found' });
    });
  });
});


