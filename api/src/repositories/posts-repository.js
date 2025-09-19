// Interface documentation for PostsRepository
// Methods: create(post), getById(id), list(page, pageSize), replace(id, post), update(id, partial), delete(id), count()

class InMemoryPostsRepository {
  constructor() {
    this.postsById = new Map();
  }

  async create(post) {
    this.postsById.set(post.id, post);
    return post;
  }

  async getById(id) {
    return this.postsById.get(id) || null;
  }

  async list(page, pageSize) {
    const all = Array.from(this.postsById.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return items;
  }

  async replace(id, post) {
    if (!this.postsById.has(id)) return false;
    this.postsById.set(id, post);
    return true;
  }

  async update(id, partial) {
    const existing = this.postsById.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...partial };
    this.postsById.set(id, updated);
    return updated;
  }

  async delete(id) {
    return this.postsById.delete(id);
  }

  async count() {
    return this.postsById.size;
  }
}

function createRepository() {
  return new InMemoryPostsRepository();
}

module.exports = { InMemoryPostsRepository, createRepository };


