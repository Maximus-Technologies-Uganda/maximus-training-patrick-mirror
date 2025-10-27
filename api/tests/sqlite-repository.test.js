const fs = require('fs');
const path = require('path');
const os = require('os');

let SqlitePostsRepository;
let sqliteAvailable = false;

try {
  ({ SqlitePostsRepository } = require('../src/repositories/SqlitePostsRepository'));
  // Test if better-sqlite3 native bindings are available by trying to load the Database class
  const Database = require('better-sqlite3');
  // Try to create a test database to verify bindings work
  const testDb = new Database(':memory:');
  testDb.close();
  sqliteAvailable = true;
} catch {
  // skip all tests if better-sqlite3 is unavailable or native bindings fail
  sqliteAvailable = false;
}

function tempDbFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'postsrepo-'));
  return path.join(dir, 'test.sqlite');
}

describe('SqlitePostsRepository', () => {
  if (!sqliteAvailable) {
    it.skip('skipped because better-sqlite3 is not installed', () => {});
    return;
  }

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


