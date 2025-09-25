// Interface documentation for PostsRepository
// Methods: create(post), getById(id), list(page, pageSize), replace(id, post), update(id, partial), delete(id), count()

// Note: Do NOT require SqlitePostsRepository at module load to avoid requiring
// optional native dependency when not needed. We'll require lazily below.

// Lazy nanoid loader to avoid ESM/CJS interop issues in Jest
let nanoidFn;
function getNanoid() {
  if (!nanoidFn) {
    try {
      ({ nanoid: nanoidFn } = require('nanoid'));
    } catch {
      nanoidFn = () => Math.random().toString(36).slice(2, 10);
    }
  }
  return nanoidFn;
}

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function compareByCreatedAt(order) {
  const isDesc = (order || 'desc') === 'desc';
  return (a, b) => {
    const cmp = String(a.createdAt).localeCompare(String(b.createdAt));
    if (cmp === 0) {
      // Tie-breaker by id ascending for deterministic order
      const idCmp = String(a.id).localeCompare(String(b.id));
      return idCmp;
    }
    return isDesc ? -cmp : cmp;
  };
}

class InMemoryPostsRepository {
  constructor() {
    this.postsById = new Map();
  }

  async create(post) {
    const nowIso = new Date().toISOString();
    const toStore = {
      id: post.id || getNanoid()(),
      title: post.title,
      content: post.content,
      tags: Array.isArray(post.tags) ? post.tags : [],
      published: post.published ?? false,
      createdAt: post.createdAt || nowIso,
      updatedAt: post.updatedAt || nowIso
    };
    this.postsById.set(toStore.id, deepClone(toStore));
    return deepClone(toStore);
  }

  async getById(id) {
    const found = this.postsById.get(id) || null;
    return found ? deepClone(found) : null;
  }

  /**
   * List posts with ordering and simple pagination.
   * @param {number} page 1-based page index
   * @param {number} pageSize number of items per page
   * @param {('asc'|'desc')} [order='desc'] ordering by createdAt
   */
  async list(page, pageSize, order) {
    const all = Array.from(this.postsById.values()).sort(compareByCreatedAt(order));
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize).map(deepClone);
    return items;
  }

  async replace(id, post) {
    if (!this.postsById.has(id)) return false;
    const toStore = deepClone({ ...post, id });
    this.postsById.set(id, toStore);
    return true;
  }

  async update(id, partial) {
    const existing = this.postsById.get(id);
    if (!existing) return null;
    const merged = { ...existing, ...partial };
    this.postsById.set(id, deepClone(merged));
    return deepClone(merged);
  }

  async delete(id) {
    return this.postsById.delete(id);
  }

  async count() {
    return this.postsById.size;
  }
}

function createRepository() {
  const backend = (process.env.POSTS_REPOSITORY || '').toLowerCase();
  if (backend === 'sqlite') {
    let SqlitePostsRepository;
    try {
      ({ SqlitePostsRepository } = require('./SqlitePostsRepository'));
    } catch {
      throw new Error('POSTS_REPOSITORY=sqlite but better-sqlite3 is not installed. Install optional dependency better-sqlite3.');
    }
    const dbFile = process.env.DB_FILE || undefined;
    return new SqlitePostsRepository(dbFile);
  }
  return new InMemoryPostsRepository();
}

module.exports = { InMemoryPostsRepository, createRepository };


