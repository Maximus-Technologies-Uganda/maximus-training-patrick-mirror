import { toggle, remove } from '../src/todo-core-v2.js';

function mk(id, title, { due = null, priority = 'med', done = false } = {}) {
  return { id, title, due, priority, done };
}

describe('todo-core-v2.toggle & remove', () => {
  it('toggle() flips done for matching id and leaves others untouched', () => {
    const a = mk('a', 'A');
    const b = mk('b', 'B', { done: true });
    const state = [a, b];

    const afterA = toggle(state, 'a');
    expect(afterA).not.toBe(state);
    const a1 = afterA.find((t) => t.id === 'a');
    const b1 = afterA.find((t) => t.id === 'b');
    expect(a1.done).toBe(true);
    expect(b1.done).toBe(true);
    // Other objects are referentially equal when unchanged
    expect(b1).toBe(b);

    const afterAAgain = toggle(afterA, 'a');
    const a2 = afterAAgain.find((t) => t.id === 'a');
    expect(a2.done).toBe(false);
  });

  it('toggle() with unknown id is a no-op and returns the same array reference', () => {
    const state = [mk('a', 'A')];
    const after = toggle(state, 'missing');
    expect(after).toBe(state);
  });

  it('remove() deletes the item by id immutably', () => {
    const a = mk('a', 'A');
    const b = mk('b', 'B');
    const state = [a, b];
    const after = remove(state, 'a');
    expect(after).toHaveLength(1);
    expect(after[0]).toBe(b);
    // original not mutated
    expect(state).toHaveLength(2);
  });

  it('remove() with unknown id is a no-op and returns the same array reference', () => {
    const state = [mk('a', 'A')];
    const after = remove(state, 'missing');
    expect(after).toBe(state);
  });
});
