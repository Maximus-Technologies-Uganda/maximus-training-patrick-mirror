let Database;
try {
  Database = require('better-sqlite3');
} catch (_e) {
  throw new Error('better-sqlite3 is not installed. Install it or set POSTS_REPOSITORY=inmemory');
}
const fs = require('fs');
const path = require('path');

class SqlitePostsRepository {
  constructor(databaseFilePath) {
    const resolvedPath = databaseFilePath || path.join(__dirname, '../../db.sqlite');
    const dirname = path.dirname(resolvedPath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    this.db = new Database(resolvedPath);
    this._initializeSchema();
  }

  _initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        published INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
    `);
  }

  async create(post) {
    const stmt = this.db.prepare(`
      INSERT INTO posts (id, title, content, tags, published, createdAt, updatedAt)
      VALUES (@id, @title, @content, @tags, @published, @createdAt, @updatedAt)
    `);
    stmt.run({
      id: post.id,
      title: post.title,
      content: post.content,
      tags: JSON.stringify(Array.isArray(post.tags) ? post.tags : []),
      published: post.published ? 1 : 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    });
    return post;
  }

  async getById(id) {
    const row = this.db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);
    return row ? this._rowToPost(row) : null;
  }

  async list(page, pageSize) {
    const offset = (page - 1) * pageSize;
    const rows = this.db.prepare(`
      SELECT * FROM posts
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset);
    return rows.map(r => this._rowToPost(r));
  }

  async replace(id, post) {
    const stmt = this.db.prepare(`
      UPDATE posts
      SET title=@title, content=@content, tags=@tags, published=@published, createdAt=@createdAt, updatedAt=@updatedAt
      WHERE id=@id
    `);
    const info = stmt.run({
      id,
      title: post.title,
      content: post.content,
      tags: JSON.stringify(Array.isArray(post.tags) ? post.tags : []),
      published: post.published ? 1 : 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    });
    return info.changes > 0;
  }

  async update(id, partial) {
    const existing = await this.getById(id);
    if (!existing) return null;
    const merged = {
      ...existing,
      ...partial
    };
    const ok = await this.replace(id, merged);
    return ok ? merged : null;
  }

  async delete(id) {
    const info = this.db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  async count() {
    const row = this.db.prepare(`SELECT COUNT(*) as count FROM posts`).get();
    return row.count;
  }

  _rowToPost(row) {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: this._parseTags(row.tags),
      published: !!row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  _parseTags(tagsText) {
    if (typeof tagsText !== 'string' || tagsText.length === 0) return [];
    try {
      const parsed = JSON.parse(tagsText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }
}

module.exports = { SqlitePostsRepository };


