// TypeScript facade for repository exports used by tests/integration

import type { Post, PostCreate, PostUpdate } from "../core/posts/post.schemas";
import { createRepository as createRepositoryImpl, InMemoryPostsRepository as InMemoryPostsRepositoryImpl } from "./posts-repository";

export interface IPostsRepository {
  create(post: PostCreate & { ownerId: string }): Promise<Post>;
  getById(id: string): Promise<Post | null>;
  list(page: number, pageSize: number): Promise<Post[]>;
  replace(id: string, post: Post): Promise<boolean>;
  update(id: string, partial: PostUpdate): Promise<Post | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

export async function createRepository(): Promise<IPostsRepository> {
  const repo = await createRepositoryImpl();
  return repo as unknown as IPostsRepository;
}

export class InMemoryPostsRepository implements IPostsRepository {
  private readonly impl: IPostsRepository;

  constructor() {
    this.impl = new InMemoryPostsRepositoryImpl() as unknown as IPostsRepository;
  }

  create(post: PostCreate): Promise<Post> {
    return this.impl.create(post);
  }

  getById(id: string): Promise<Post | null> {
    return this.impl.getById(id);
  }

  list(page: number, pageSize: number): Promise<Post[]> {
    return this.impl.list(page, pageSize);
  }

  replace(id: string, post: Post): Promise<boolean> {
    return this.impl.replace(id, post);
  }

  update(id: string, partial: PostUpdate): Promise<Post | null> {
    return this.impl.update(id, partial);
  }

  delete(id: string): Promise<boolean> {
    return this.impl.delete(id);
  }

  count(): Promise<number> {
    return this.impl.count();
  }
}


