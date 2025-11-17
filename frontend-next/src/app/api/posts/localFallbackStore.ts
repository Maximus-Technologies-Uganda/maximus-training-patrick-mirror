import { buildLocalPostsSeed } from "./localFallbackSeed";
import type { LocalPost } from "./localFallbackTypes";

type GlobalWithPosts = typeof globalThis & { __LOCAL_POSTS__?: Array<LocalPost> };

const globalStore = globalThis as GlobalWithPosts;
const localPostsStore: Array<LocalPost> = globalStore.__LOCAL_POSTS__ ?? [];
if (!globalStore.__LOCAL_POSTS__) {
  globalStore.__LOCAL_POSTS__ = localPostsStore;
}

export function getLocalPostsStore(): Array<LocalPost> {
  return localPostsStore;
}

export function seedLocalPostsStore(): void {
  if (process.env.NODE_ENV === "production") return;
  if (localPostsStore.length > 0) return;
  localPostsStore.push(...buildLocalPostsSeed());
}

export function replaceLocalPostsStore(nextPosts: Array<LocalPost>): void {
  localPostsStore.splice(0, localPostsStore.length, ...nextPosts);
}

export type { LocalPost };
