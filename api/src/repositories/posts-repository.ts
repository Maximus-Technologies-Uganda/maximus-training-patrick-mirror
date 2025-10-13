export interface PostRecord {
  id: string;
  ownerId?: string;
  title: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

type Order = 'asc' | 'desc';

function deepClone<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function compareByCreatedAt(order?: Order) {
  const isDesc = (order || 'desc') === 'desc';
  return (a: PostRecord, b: PostRecord) => {
    const cmp = String(a.createdAt).localeCompare(String(b.createdAt));
    if (cmp === 0) {
      const idCmp = String(a.id).localeCompare(String(b.id));
      return idCmp;
    }
    return isDesc ? -cmp : cmp;
  };
}

export class InMemoryPostsRepository {
  private postsById = new Map<string, PostRecord>();

  async create(post: Partial<PostRecord>): Promise<PostRecord> {
    const nanoid = (await import('nanoid')).nanoid;
    const nowIso = new Date().toISOString();
    const toStore: PostRecord = {
      id: post.id || nanoid(),
      ownerId: post.ownerId,
      title: String(post.title || ''),
      content: String(post.content || ''),
      tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
      published: Boolean(post.published ?? false),
      createdAt: post.createdAt ?? nowIso,
      updatedAt: post.updatedAt ?? nowIso,
    };
    this.postsById.set(toStore.id, deepClone(toStore));
    return deepClone(toStore);
  }

  async getById(id: string): Promise<PostRecord | null> {
    const found = this.postsById.get(id) || null;
    return found ? deepClone(found) : null;
  }

  async list(page: number, pageSize: number, order?: Order): Promise<PostRecord[]> {
    const all = Array.from(this.postsById.values()).sort(compareByCreatedAt(order));
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize).map(deepClone);
    return items;
  }

  async replace(id: string, post: PostRecord): Promise<boolean> {
    if (!this.postsById.has(id)) return false;
    const toStore = deepClone({ ...post, id });
    this.postsById.set(id, toStore);
    return true;
  }

  async update(id: string, partial: Partial<PostRecord>): Promise<PostRecord | null> {
    const existing = this.postsById.get(id);
    if (!existing) return null;
    const merged = { ...existing, ...partial } as PostRecord;
    this.postsById.set(id, deepClone(merged));
    return deepClone(merged);
  }

  async delete(id: string): Promise<boolean> {
    return this.postsById.delete(id);
  }

  async count(): Promise<number> {
    return this.postsById.size;
  }
}

export async function createRepository() {
  const backend = (process.env.POSTS_REPOSITORY || '').toLowerCase();
  if (backend === 'sqlite') {
    const { SqlitePostsRepository } = await import('./SqlitePostsRepository');
    const dbFile = process.env.DB_FILE || undefined;
    return new SqlitePostsRepository(dbFile);
  }
  return new InMemoryPostsRepository();
}

export default InMemoryPostsRepository;

