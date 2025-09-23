// Repository factory for TS callers. Returns in-memory by default.
// Defers loading to the JS implementation that is covered by tests.

export type AnyRepository = unknown;

export function createRepository(): AnyRepository {
  // Use JS implementation to avoid duplication and ensure identical behavior
  const js = require('./posts-repository');
  return js.createRepository();
}

export function createInMemoryRepository(): AnyRepository {
  const js = require('./posts-repository');
  return new js.InMemoryPostsRepository();
}


