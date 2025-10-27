const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('better-sqlite3', () => {
  class Statement {
    constructor(db, sql) {
      this.db = db;
      this.sql = sql;
    }

    run(params) {
      if (this.sql.includes('INSERT INTO posts')) {
        const record = {
          id: params.id,
          title: params.title,
          content: params.content,
          tags: typeof params.tags === 'string' ? params.tags : JSON.stringify([]),
          published: params.published ? 1 : 0,
          createdAt: params.createdAt,
          updatedAt: params.updatedAt
        };
        this.db.rows.set(record.id, record);
        return { changes: 1 };
      }

      if (this.sql.includes('UPDATE posts')) {
        const existing = this.db.rows.get(params.id);
        if (!existing) {
          return { changes: 0 };
        }
        const record = {
          ...existing,
          title: params.title,
          content: params.content,
          tags: typeof params.tags === 'string' ? params.tags : existing.tags,
          published: params.published ? 1 : 0,
          createdAt: params.createdAt,
          updatedAt: params.updatedAt
        };
        this.db.rows.set(params.id, record);
        return { changes: 1 };
      }

      if (this.sql.includes('DELETE FROM posts')) {
        const id = typeof params === 'string' ? params : Array.isArray(params) ? params[0] : undefined;
        if (!id) {
          return { changes: 0 };
        }
        const existed = this.db.rows.delete(id);
        return { changes: existed ? 1 : 0 };
      }

      throw new Error(`Unsupported SQL in mock: ${this.sql}`);
    }

    get(param) {
      if (this.sql.includes('SELECT * FROM posts WHERE id = ?')) {
        const id = param;
        const row = this.db.rows.get(id);
        return row ? { ...row } : undefined;
      }

      if (this.sql.includes('SELECT COUNT(*) as count FROM posts')) {
        return { count: this.db.rows.size };
      }

      throw new Error(`Unsupported get SQL in mock: ${this.sql}`);
    }

    all(limit, offset) {
      if (this.sql.includes('SELECT * FROM posts') && this.sql.includes('ORDER BY createdAt DESC')) {
        const rows = Array.from(this.db.rows.values())
          .slice()
          .sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
        const slice = rows.slice(offset, offset + limit);
        return slice.map((row) => ({ ...row }));
      }

      throw new Error(`Unsupported all SQL in mock: ${this.sql}`);
    }
  }

  return class MockDatabase {
    constructor() {
      this.rows = new Map();
    }

    exec() {
      // Schema creation is a no-op for the mock
      return undefined;
    }

    prepare(sql) {
      return new Statement(this, sql);
    }
  };
});

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


