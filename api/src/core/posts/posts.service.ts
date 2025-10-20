// Adapter shim to preserve legacy imports; no direct Express types needed here
import type { Post, PostCreate, PostUpdate, ListPostsQuery } from "./post.schemas";
import type { PaginatedResponse } from "../pagination.types";
import type { IPostsRepository } from "../../repositories/posts.repository";

/**
 * PostsService was previously an in-memory store. It is now unused in favor of
 * the DI-friendly service in ../../services/PostsService. This file exports a
 * thin adapter to maintain existing imports if any remain.
 */
import { PostsService as DomainService } from "../../services/PostsService";
import { InMemoryPostsRepository } from "../../repositories/posts.repository";

export class PostsService {
  private readonly impl: DomainService;

  constructor(repository?: IPostsRepository) {
    const repo = repository ?? (new InMemoryPostsRepository() as unknown as IPostsRepository);
    this.impl = new DomainService(repo);
  }

  async create(data: PostCreate & { ownerId?: string }): Promise<Post> {
    const ownerId = data.ownerId ?? "unknown-owner";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await this.impl.create({ ...(data as any), ownerId });
    return created;
  }

  async getById(id: string): Promise<Post | null> {
    try {
      return await this.impl.getById(id);
    } catch {
      return null;
    }
  }

  async list(query: ListPostsQuery): Promise<PaginatedResponse<Post>> {
    return this.impl.list(query);
  }

  async replace(id: string, data: PostCreate): Promise<Post | null> {
    try {
      const updated = await this.impl.replace(id, data);
      return updated;
    } catch {
      return null;
    }
  }

  async update(id: string, data: PostUpdate): Promise<Post | null> {
    try {
      const updated = await this.impl.update(id, data);
      return updated;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.impl.delete(id);
      return true;
    } catch {
      return false;
    }
  }
}


