// TypeScript facade for repository exports used by tests/integration

export type IPostsRepository = {
  create(post: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  list(page: number, pageSize: number): Promise<any[]>;
  replace(id: string, post: any): Promise<boolean>;
  update(id: string, partial: any): Promise<any | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
};

export function createRepository(): IPostsRepository {
  const js = require('./posts-repository');
  return js.createRepository();
}

export class InMemoryPostsRepository implements IPostsRepository {
  private impl: any;
  constructor() {
    const js = require('./posts-repository');
    this.impl = new js.InMemoryPostsRepository();
  }
  create(post: any) { return this.impl.create(post); }
  getById(id: string) { return this.impl.getById(id); }
  list(page: number, pageSize: number) { return this.impl.list(page, pageSize); }
  replace(id: string, post: any) { return this.impl.replace(id, post); }
  update(id: string, partial: any) { return this.impl.update(id, partial); }
  delete(id: string) { return this.impl.delete(id); }
  count() { return this.impl.count(); }
}


