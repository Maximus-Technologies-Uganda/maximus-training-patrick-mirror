// nanoid v5 ESM default uses import; for Jest CJS tests we rely on existing mocks
// Avoid top-level import to let tests mock; dynamically load when needed
let nanoidFn;
function getNanoid() {
  if (!nanoidFn) {
    try {
      ({ nanoid: nanoidFn } = require('nanoid'));
    } catch {
      // fallback simple id for environments where ESM import is problematic
      nanoidFn = () => Math.random().toString(36).slice(2, 10);
    }
  }
  return nanoidFn;
}
const { makeError } = require('../lib/errors');

class PostsService {
  constructor(repository) {
    this.repository = repository;
  }

  async create(data) {
    const now = new Date().toISOString();
    const post = {
      id: getNanoid()(),
      ownerId: data.ownerId,
      title: data.title,
      content: data.content,
      tags: Array.isArray(data.tags) ? data.tags : [],
      published: data.published ?? false,
      createdAt: now,
      updatedAt: now
    };
    await this.repository.create(post);
    return post;
  }

  async getById(id) {
    const post = await this.repository.getById(id);
    if (!post) throw makeError('not_found', 'Post not found');
    return post;
  }

  async list(page, pageSize) {
    // Defensive bounds check at service layer to ensure invariants even if callers forget
    if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 100) {
      throw makeError('validation_error', 'Invalid pagination parameters');
    }
    const items = await this.repository.list(page, pageSize);
    const total = await this.repository.count();
    const start = (page - 1) * pageSize;
    const hasNextPage = start + items.length < total;
    return { items, hasNextPage };
  }

  async replace(id, data) {
    const existing = await this.repository.getById(id);
    if (!existing) throw makeError('not_found', 'Post not found');
    const now = new Date().toISOString();
    const updated = {
      id: existing.id,
      ownerId: existing.ownerId,
      title: data.title,
      content: data.content,
      tags: Array.isArray(data.tags) ? data.tags : [],
      published: data.published ?? false,
      createdAt: existing.createdAt,
      updatedAt: now
    };
    await this.repository.replace(id, updated);
    return updated;
  }

  async update(id, partial) {
    const existing = await this.repository.getById(id);
    if (!existing) throw makeError('not_found', 'Post not found');
    const now = new Date().toISOString();
    const merged = {
      ...existing,
      ...partial,
      updatedAt: now
    };
    const saved = await this.repository.update(id, merged);
    return saved;
  }

  async delete(id) {
    const existed = await this.repository.delete(id);
    if (!existed) throw makeError('not_found', 'Post not found');
  }
}

module.exports = { PostsService };


