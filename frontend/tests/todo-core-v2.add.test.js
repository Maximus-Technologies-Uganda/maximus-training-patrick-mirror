import { add } from '../src/todo-core-v2.js';
import { initTodoDom } from '../src/todo-dom.js';
import { save, load } from '../src/todo-storage.js';

function ymdLocal(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('todo-core-v2.add', () => {
  it('adds a task with generated id and default priority=med, due defaults to today via clock()', () => {
    const clockNow = new Date('2025-01-02T10:20:30');
    const deps = { idgen: () => 'id-001', clock: () => clockNow };
    const state = [];

    const next = add(state, { title: 'Buy milk' }, deps);

    expect(next).toHaveLength(1);
    const t = next[0];
    expect(t.id).toBe('id-001');
    expect(t.title).toBe('Buy milk');
    expect(t.priority).toBe('med');
    expect(t.done).toBe(false);
    expect(t.due).toBeInstanceOf(Date);
    expect(ymdLocal(t.due)).toBe(ymdLocal(clockNow));

    // original state is not mutated
    expect(state).toEqual([]);
  });

  it('respects explicit priority and explicit due', () => {
    const clockNow = new Date('2025-01-02T10:20:30');
    const deps = { idgen: () => 'id-002', clock: () => clockNow };
    const due = new Date('2025-01-05T12:00:00');
    const next = add([], { title: 'Walk dog', due, priority: 'high' }, deps);
    const t = next[0];
    expect(t.priority).toBe('high');
    expect(ymdLocal(t.due)).toBe(ymdLocal(due));
  });

  it('allows null due without using clock and preserves null', () => {
    const clock = vi.fn(() => new Date('2025-01-02T10:20:30'));
    const deps = { idgen: () => 'id-003', clock };
    const next = add([], { title: 'No due', due: null }, deps);
    expect(clock).not.toHaveBeenCalled();
    expect(next[0].due).toBeNull();
  });

  it('uses injected idgen() and clock() when due omitted', () => {
    const idgen = vi.fn(() => 'custom-id');
    const clock = vi.fn(() => new Date('2026-06-07T03:04:05'));
    const deps = { idgen, clock };
    const next = add([], { title: 'With deps' }, deps);
    expect(idgen).toHaveBeenCalledTimes(1);
    expect(clock).toHaveBeenCalledTimes(1);
    expect(next[0].id).toBe('custom-id');
    expect(ymdLocal(next[0].due)).toBe('2026-06-07');
  });

  it.each([
    { name: 'empty', title: '' },
    { name: 'whitespace', title: '    ' },
  ])('rejects $name title', ({ title }) => {
    const deps = { idgen: () => 'x', clock: () => new Date() };
    expect(() => add([], { title }, deps)).toThrow(/title/i);
  });

  it('rejects duplicate titles (normalized, case/space-insensitive)', () => {
    const deps = { idgen: () => '1', clock: () => new Date('2025-01-01T00:00:00') };
    const s1 = add([], { title: '  Buy    MILK  ' }, deps);
    expect(() => add(s1, { title: 'buy milk' }, deps)).toThrow(/duplicate/i);
  });

  it('does not mutate existing items; returns a new array', () => {
    const deps = { idgen: () => '1', clock: () => new Date('2025-01-01T00:00:00') };
    const base = [{ id: 'a', title: 'A', due: null, priority: 'med', done: false }];
    const next = add(base, { title: 'B' }, deps);
    expect(next).not.toBe(base);
    expect(base).toEqual([{ id: 'a', title: 'A', due: null, priority: 'med', done: false }]);
    expect(next).toHaveLength(2);
  });

  it('dom coverage smoke: initializes DOM and adds one item', () => {
    document.body.innerHTML = `
      <form id="add-task-form">
        <input id="task-title" />
        <input id="task-due" type="date" />
        <input id="task-priority" type="checkbox" />
      </form>
      <div id="error" role="alert" aria-live="polite"></div>
      <input id="search-text" />
      <select id="filter-due-type"><option value="all">All</option></select>
      <select id="filter-priority"><option value="all">All</option></select>
      <a id="export-csv"></a>
      <ul id="task-list"></ul>`;

    const api = initTodoDom(document, { idgen: () => 'cov-1', clock: () => new Date('2025-02-03T00:00:00') });
    expect(typeof api.render).toBe('function');

    const input = document.querySelector('#task-title');
    input.value = 'Coverage item';
    document.querySelector('#add-task-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelectorAll('li.task-item').length).toBe(1);

    // storage smoke
    save('x', 'gate-smoke');
    expect(load('gate-smoke')).toBe('x');
  });
});


