const fs = require('fs');
const path = require('path');
const os = require('os');

let SqlitePostsRepository;
try {
  ({ SqlitePostsRepository } = require('../src/repositories/SqlitePostsRepository'));
} catch (_e) {
  // skip all tests if better-sqlite3 is unavailable
  describe('SqlitePostsRepository', () => {
    it.skip('skipped because better-sqlite3 is not installed', () => {});
  });
}

function tempDbFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'postsrepo-'));
  return path.join(dir, 'test.sqlite');
}

if (SqlitePostsRepository) describe('SqlitePostsRepository', () => {
  it('performs CRUD operations correctly', async () => {
    const dbFile = tempDbFile();
    const repo = new SqlitePostsRepository(dbFile);

    const now = new Date().toISOString();
    const post = {
      id: 'p1',
      title: 'T',
      content: 'C',
      tags: ['a', 'b'],
      published: false,
      createdAt: now,
      updatedAt: now
    };

    await repo.create(post);
    const fetched = await repo.getById('p1');
    expect(fetched).toEqual(post);

    const list1 = await repo.list(1, 10);
    expect(list1).toHaveLength(1);

    const updated = { ...post, title: 'T2' };
    const replaced = await repo.replace('p1', updated);
    expect(replaced).toBe(true);
    const fetched2 = await repo.getById('p1');
    expect(fetched2.title).toBe('T2');

    const merged = await repo.update('p1', { content: 'C2' });
    expect(merged.content).toBe('C2');

    const count = await repo.count();
    expect(count).toBe(1);

    const deleted = await repo.delete('p1');
    expect(deleted).toBe(true);
    const count2 = await repo.count();
    expect(count2).toBe(0);
  });
});


