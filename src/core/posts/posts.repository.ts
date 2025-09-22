import type { Post, PostCreate, PostUpdate, ListPostsQuery } from "./post.schemas";

/**
 * IPostsRepository defines the contract for persisting and retrieving Post entities.
 * Implementations may use databases, in-memory stores, or external services.
 */
export interface IPostsRepository {
  /**
   * Create a new Post.
   * @param data - Validated input for creating a post
   * @returns The newly created Post
   */
  create(data: PostCreate): Promise<Post>;

  /**
   * Retrieve a Post by its unique identifier.
   * @param id - The post id (UUID string)
   * @returns The Post if found, otherwise null
   */
  getById(id: string): Promise<Post | null>;

  /**
   * List posts using pagination parameters.
   * @param query - Pagination options (page and pageSize)
   * @returns An array of Posts for the requested page
   */
  list(query: ListPostsQuery): Promise<Post[]>;

  /**
   * Update an existing Post by id.
   * @param id - The post id (UUID string)
   * @param data - Partial set of fields to update (at least one required)
   * @returns The updated Post if found, otherwise null
   */
  update(id: string, data: PostUpdate): Promise<Post | null>;

  /**
   * Delete a Post by its id.
   * @param id - The post id (UUID string)
   * @returns True if a post was deleted, false if no matching post existed
   */
  delete(id: string): Promise<boolean>;
}


