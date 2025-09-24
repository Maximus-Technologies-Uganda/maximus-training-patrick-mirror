declare module "../src/config.js" {
  export function loadConfigFromEnv(): {
    port: number;
    jsonLimit: string;
    rateLimitWindowMs: number;
    rateLimitMax: number;
  };
}

declare module "../src/repositories/posts-repository.js" {
  export class InMemoryPostsRepository {
    constructor();
    create(post: any): Promise<any>;
    getById(id: string): Promise<any>;
    list(page: number, pageSize: number): Promise<any[]>;
    replace(id: string, post: any): Promise<boolean>;
    update(id: string, partial: any): Promise<any>;
    delete(id: string): Promise<boolean>;
    count(): Promise<number>;
  }
  export function createRepository(): any;
}


