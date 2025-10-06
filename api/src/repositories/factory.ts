// Repository factory for TS callers. Returns in-memory by default.
// Defers loading to the JS implementation that is covered by tests.

import { createRepository as createPostsRepository, InMemoryPostsRepository } from "./posts-repository";

export type AnyRepository = unknown;

export function createRepository(): AnyRepository {
  // Use JS implementation to avoid duplication and ensure identical behavior
  return createPostsRepository();
}

export function createInMemoryRepository(): AnyRepository {
  return new InMemoryPostsRepository();
}


