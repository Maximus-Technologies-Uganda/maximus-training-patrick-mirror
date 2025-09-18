import { filter } from '../src/todo-core-v2.js';

function d(iso) {
  return new Date(iso);
}

function mk(id, title, { due = null, priority = 'med', done = false } = {}) {
  return { id, title, due, priority, done };
}

describe('todo-core-v2.filter', () => {
  const base = new Date('2025-03-10T12:00:00');

  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    vi.setSystemTime(base);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('filters by text (case/space-insensitive substring)', () => {
    const state = [
      mk('1', 'Pay rent'),
      mk('2', 'buy  milk'),
      mk('3', 'Walk the dog'),
    ];
    const out = filter(state, { text: '  RENT ' }).map((t) => t.id);
    expect(out).toEqual(['1']);
  });

  it('filters by dueType: today, tomorrow, overdue, all (null dues excluded unless all)', () => {
    const today = d('2025-03-10T05:00:00');
    const tomorrow = d('2025-03-11T09:30:00');
    const yesterday = d('2025-03-09T23:59:00');
    const state = [
      mk('t', 'today', { due: today }),
      mk('n', 'none', { due: null }),
      mk('tm', 'tomorrow', { due: tomorrow }),
      mk('y', 'yesterday', { due: yesterday }),
    ];

    const onlyToday = filter(state, { dueType: 'today' }).map((t) => t.id);
    expect(onlyToday).toEqual(['t']);

    const onlyTomorrow = filter(state, { dueType: 'tomorrow' }).map(
      (t) => t.id
    );
    expect(onlyTomorrow).toEqual(['tm']);

    const onlyOverdue = filter(state, { dueType: 'overdue' }).map((t) => t.id);
    expect(onlyOverdue).toEqual(['y']);

    const all = filter(state, { dueType: 'all' })
      .map((t) => t.id)
      .sort();
    expect(all).toEqual(['n', 't', 'tm', 'y'].sort());
  });

  it('filters by priority low/med/high/all', () => {
    const state = [
      mk('a', 'A', { priority: 'low' }),
      mk('b', 'B', { priority: 'med' }),
      mk('c', 'C', { priority: 'high' }),
    ];
    expect(filter(state, { priority: 'low' }).map((t) => t.id)).toEqual(['a']);
    expect(filter(state, { priority: 'med' }).map((t) => t.id)).toEqual(['b']);
    expect(filter(state, { priority: 'high' }).map((t) => t.id)).toEqual(['c']);
    expect(
      filter(state, { priority: 'all' })
        .map((t) => t.id)
        .sort()
    ).toEqual(['a', 'b', 'c'].sort());
  });

  it('composes text + dueType + priority', () => {
    const today = d('2025-03-10T01:00:00');
    const tomorrow = d('2025-03-11T10:00:00');
    const state = [
      mk('1', 'Pay rent', { due: today, priority: 'high' }),
      mk('2', 'Pay taxes', { due: today, priority: 'med' }),
      mk('3', 'Pay rent', { due: tomorrow, priority: 'high' }),
      mk('4', 'Grocery shopping', { due: today, priority: 'high' }),
    ];
    const out = filter(state, {
      text: 'pay',
      dueType: 'today',
      priority: 'high',
    }).map((t) => t.id);
    expect(out).toEqual(['1']);
  });

  it('dom/storage coverage smoke', () => {
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

    const { initTodoDom } = require('../src/todo-dom.js');
    const { save, load } = require('../src/todo-storage.js');
    const api = initTodoDom(document, {
      idgen: () => 'smk',
      clock: () => new Date('2025-03-10T00:00:00'),
    });
    expect(typeof api.render).toBe('function');
    document.querySelector('#task-title').value = 'X';
    document
      .querySelector('#add-task-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelectorAll('li.task-item').length).toBe(1);

    save('y', 'z');
    expect(load('z')).toBe('y');
  });
});
