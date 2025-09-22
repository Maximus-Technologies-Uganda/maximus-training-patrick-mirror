import { randomUUID } from "node:crypto";
import type { Post, PostCreate, PostUpdate, ListPostsQuery } from "../../../../src/core/posts/post.schemas";
import type { IPostsRepository } from "../../../../src/core/posts/posts.repository";

/**
 * PostsService is an in-memory implementation of the IPostsRepository interface.
 *
 * It maintains posts in-process using a simple array. This is suitable for
 * development, tests, or scenarios where persistence is not required.
 */
export class PostsService implements IPostsRepository {
  /** In-memory data store for posts */
  private posts: Post[] = [];

  /**
   * Create a new Post and store it in memory.
   * @param data - Validated input for creating a post
   * @returns The newly created Post
   */
  async create(data: PostCreate): Promise<Post> {
    const now = new Date();
    const post: Post = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.posts.push(post);
    return post;
  }

  /**
   * Retrieve a Post by its unique identifier.
   * @param id - The post id (UUID string)
   * @returns The Post if found, otherwise null
   */
  async getById(id: string): Promise<Post | null> {
    const found = this.posts.find((p) => p.id === id) ?? null;
    return found;
  }

  /**
   * List posts using pagination parameters.
   * @param query - Pagination options (page and pageSize)
   * @returns An array of Posts for the requested page
   */
  async list(query: ListPostsQuery): Promise<Post[]> {
    const { page, pageSize } = query;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.posts.slice(start, end);
  }

  /**
   * Update an existing Post by id by merging provided fields.
   * @param id - The post id (UUID string)
   * @param data - Partial set of fields to update (at least one required)
   * @returns The updated Post if found, otherwise null
   */
  async update(id: string, data: PostUpdate): Promise<Post | null> {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.posts[index];
    const updated: Post = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.posts[index] = updated;
    return updated;
  }

  /**
   * Delete a Post by its id.
   * @param id - The post id (UUID string)
   * @returns True if a post was deleted, false if no matching post existed
   */
  async delete(id: string): Promise<boolean> {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.posts.splice(index, 1);
    return true;
  }
}


