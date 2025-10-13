// Repository factory for TS callers with proper typing
import type { IPostsRepository } from "./posts.repository";
import { createRepository as createTypedRepository, InMemoryPostsRepository as TypedInMemoryRepo } from "./posts.repository";

export function createRepository(): Promise<IPostsRepository> {
  return createTypedRepository();
}

export function createInMemoryRepository(): IPostsRepository {
  return new TypedInMemoryRepo();
}


