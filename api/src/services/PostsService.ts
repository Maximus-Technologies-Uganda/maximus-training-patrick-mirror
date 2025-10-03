import { nanoid } from 'nanoid';
import type { IPostsRepository } from '../repositories/posts.repository';
import { NotFoundError } from '../errors/NotFoundError';

// Reuse types from shared core schema definitions for strong typing
import type { Post, PostCreate, PostUpdate, ListPostsQuery } from '../core/posts/post.schemas';
import type { PaginatedResponse } from '../core/pagination.types';

/**
 * Service layer responsible for business rules around Posts.
 * Adds defaults, timestamp management, validation, and domain errors on top of repository semantics.
 */
export interface IPostsService {
  create(data: PostCreate): Promise<Post>;
  getById(id: string): Promise<Post>;
  list(query: ListPostsQuery): Promise<PaginatedResponse<Post>>;
  replace(id: string, data: PostCreate): Promise<Post>;
  update(id: string, partial: PostUpdate): Promise<Post>;
  delete(id: string): Promise<void>;
}

export class PostsService implements IPostsService {
  private readonly repository: IPostsRepository;

  constructor(repository: IPostsRepository) {
    this.repository = repository;
  }

  /** Create a post with defaults and timestamps. */
  async create(data: PostCreate): Promise<Post> {
    const nowIso = new Date().toISOString();
    // Defensive copy and defaults
    const toCreate = {
      id: nanoid(),
      title: data.title,
      content: data.content,
      tags: Array.isArray(data.tags) ? [...data.tags] : [],
      published: data.published ?? false,
      createdAt: nowIso,
      updatedAt: nowIso,
    } as const;

    await this.repository.create(toCreate);

    // Map repository ISO strings to Date per core Post type contract
    const created: Post = {
      id: toCreate.id,
      title: toCreate.title,
      content: toCreate.content,
      tags: toCreate.tags,
      published: toCreate.published,
      createdAt: new Date(toCreate.createdAt),
      updatedAt: new Date(toCreate.updatedAt),
    };

    return created;
  }

  /** Fetch a post by id or throw domain not-found error. */
  async getById(id: string): Promise<Post> {
    const found = await this.repository.getById(id);
    if (!found) throw new NotFoundError({ id });
    return this.mapStoredToDomain(found);
  }

  /** List posts with pagination metadata computed from repository. */
  async list(query: ListPostsQuery): Promise<PaginatedResponse<Post>> {
    const page = query.page;
    const pageSize = query.pageSize;
    const itemsStored = await this.repository.list(page, pageSize);
    const total = await this.repository.count();
    const start = (page - 1) * pageSize;
    const hasNextPage = start + itemsStored.length < total;

    const items = itemsStored.map((p: any) => this.mapStoredToDomain(p));
    const totalPages = pageSize === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items,
      totalItems: total,
      totalPages,
      currentPage: page,
      hasNextPage,
      pageSize,
    };
  }

  /** Replace an existing post, preserving id and createdAt; bump updatedAt. */
  async replace(id: string, data: PostCreate): Promise<Post> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new NotFoundError({ id });
    const nowIso = new Date().toISOString();

    const replaced = {
      id: existing.id,
      title: data.title,
      content: data.content,
      tags: Array.isArray(data.tags) ? [...data.tags] : [],
      published: data.published ?? false,
      createdAt: existing.createdAt,
      updatedAt: nowIso,
    };

    await this.repository.replace(id, replaced);
    return this.mapStoredToDomain(replaced);
  }

  /** Merge allowed fields; do not allow changing id/createdAt; bump updatedAt. */
  async update(id: string, partial: PostUpdate): Promise<Post> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new NotFoundError({ id });
    const nowIso = new Date().toISOString();

    const merged = {
      ...existing,
      ...(partial.title !== undefined ? { title: partial.title } : {}),
      ...(partial.content !== undefined ? { content: partial.content } : {}),
      ...(partial.tags !== undefined ? { tags: Array.isArray(partial.tags) ? [...partial.tags] : [] } : {}),
      ...(partial.published !== undefined ? { published: partial.published } : {}),
      updatedAt: nowIso,
    };

    const saved = await this.repository.update(id, merged);
    // Repository returns null if not found; defensive check
    if (!saved) throw new NotFoundError({ id });
    return this.mapStoredToDomain(saved);
  }

  /** Delete a post by id or throw not-found. */
  async delete(id: string): Promise<void> {
    const ok = await this.repository.delete(id);
    if (!ok) throw new NotFoundError({ id });
  }

  private mapStoredToDomain(stored: any): Post {
    return {
      id: String(stored.id),
      title: String(stored.title),
      content: String(stored.content),
      tags: Array.isArray(stored.tags) ? stored.tags.slice() : [],
      published: Boolean(stored.published),
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    };
  }
}


