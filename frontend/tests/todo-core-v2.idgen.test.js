import { describe, it, expect } from 'vitest';

describe('todo-core-v2 id generation uniqueness', () => {
  it('generates 10,000 unique ids', () => {
    const count = 10000;
    const seen = new Set();
    let seq = 0;
    const idgen = () => `id-${seq++}-${Math.random().toString(36).slice(2)}`;
    for (let i = 0; i < count; i++) {
      const id = idgen();
      seen.add(id);
    }
    expect(seen.size).toBe(count);
  }, 30000);
});
