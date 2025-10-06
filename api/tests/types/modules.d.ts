declare module "../src/config.js" {
  export function loadConfigFromEnv(): {
    port: number;
    jsonLimit: string;
    rateLimitWindowMs: number;
    rateLimitMax: number;
  };
}

declare module "../src/repositories/posts-repository.js" {
  import type { PostRecord, createRepository as createRepositoryTs } from "../src/repositories/posts-repository";

  export class InMemoryPostsRepository {
    constructor();
    create(post: Partial<PostRecord>): Promise<PostRecord>;
    getById(id: string): Promise<PostRecord | null>;
    list(page: number, pageSize: number): Promise<PostRecord[]>;
    replace(id: string, post: PostRecord): Promise<boolean>;
    update(id: string, partial: Partial<PostRecord>): Promise<PostRecord | null>;
    delete(id: string): Promise<boolean>;
    count(): Promise<number>;
  }
  export function createRepository(): ReturnType<typeof createRepositoryTs>;
}


