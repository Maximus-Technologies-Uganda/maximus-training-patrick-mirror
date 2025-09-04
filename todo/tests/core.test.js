const core = require('../src/core');

describe('core: validateDue', () => {
  test('accepts null/empty and valid YYYY-MM-DD, rejects invalid', () => {
    expect(core.validateDue(null)).toBe(true);
    expect(core.validateDue('')).toBe(true);
    expect(core.validateDue('2025-02-28')).toBe(true);
    expect(core.validateDue('2025-02-29')).toBe(false);
    expect(core.validateDue('2025-13-01')).toBe(false);
    expect(core.validateDue('2025-00-10')).toBe(false);
    expect(core.validateDue('2025-01-00')).toBe(false);
    expect(core.validateDue('2025/01/01')).toBe(false);
    expect(core.validateDue('abcd-ef-gh')).toBe(false);
  });
});

describe('core: parseAddArgs/parseListArgs', () => {
  test('parseAddArgs extracts text, due and priority (supports equals and split forms)', () => {
    const a = core.parseAddArgs(['Buy', 'milk', '--due=2030-01-02', '--priority=HIGH']);
    expect(a).toEqual({ text: 'Buy milk', due: '2030-01-02', priority: 'high' });

    const b = core.parseAddArgs(['  Trim  ', 'me  ', '--due', '2031-12-31', '--priority', 'Low']);
    expect(b).toEqual({ text: 'Trim me', due: '2031-12-31', priority: 'low' });
  });

  test('parseListArgs detects flags', () => {
    expect(core.parseListArgs(['--dueToday'])).toEqual({ dueToday: true, highPriority: false });
    expect(core.parseListArgs(['--highPriority'])).toEqual({ dueToday: false, highPriority: true });
    expect(core.parseListArgs(['--dueToday', '--highPriority'])).toEqual({ dueToday: true, highPriority: true });
    expect(core.parseListArgs(['none'])).toEqual({ dueToday: false, highPriority: false });
  });
});

describe('core: addTodo validations and success', () => {
  test('errors: missing text, invalid due, invalid priority, duplicate', () => {
    const todos = [];
    expect(core.addTodo(todos, { text: '', due: null, priority: 'low' }).ok).toBe(false);
    expect(core.addTodo(todos, { text: 'x', due: '2025-02-30', priority: 'low' }).error).toBe('invalid_due');
    expect(core.addTodo(todos, { text: 'x', due: null, priority: 'urgent' }).error).toBe('invalid_priority');

    const withOne = [{ id: 1, text: ' Hello World ', completed: false }];
    const dup = core.addTodo(withOne, { text: 'hello world', due: null, priority: 'low' });
    expect(dup.ok).toBe(false);
    expect(dup.error).toBe('duplicate');
  });

  test('success: creates todo with normalized priority, next id and createdAt using provided now', () => {
    const existing = [{ id: 1, text: 'a' }, { id: 3, text: 'b' }];
    const fakeNow = new Date('2001-02-03T04:05:06.000Z');
    const res = core.addTodo(existing, { text: 'New Task', due: '2030-01-01', priority: 'HIGH' }, fakeNow);
    expect(res.ok).toBe(true);
    expect(res.todo).toMatchObject({ id: 4, text: 'New Task', due: '2030-01-01', priority: 'high', completed: false });
    expect(res.todo.createdAt).toBe(fakeNow.toISOString());
    expect(res.todos.length).toBe(existing.length + 1);
  });
});

describe('core: listTodos and filters', () => {
  test('mutually exclusive flags error', () => {
    const r = core.listTodos([], { dueToday: true, highPriority: true }, '2025-01-01');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('mutually_exclusive');
  });

  test('table-driven: dueToday boundaries', () => {
    const today = '2025-04-01';
    const cases = [
      { text: 'yesterday', due: '2025-03-31' },
      { text: 'today', due: '2025-04-01' },
      { text: 'tomorrow', due: '2025-04-02' },
    ].map((t, i) => ({ id: i + 1, priority: 'medium', completed: false, ...t }));
    const r = core.listTodos(cases, { dueToday: true, highPriority: false }, today);
    expect(r.ok).toBe(true);
    expect(r.results.map(t => t.text)).toEqual(['today']);
  });

  test('highPriority selects only high priority (case-insensitive)', () => {
    const todos = [
      { id: 1, text: 'a', priority: 'low' },
      { id: 2, text: 'b', priority: 'HIGH' },
      { id: 3, text: 'c', priority: 'medium' },
      { id: 4, text: 'd' },
    ];
    const r = core.listTodos(todos, { dueToday: false, highPriority: true }, '2000-01-01');
    expect(r.ok).toBe(true);
    expect(r.results.map(t => t.id)).toEqual([2]);
  });
});

describe('core: completeTodo', () => {
  test('invalid id and not found', () => {
    expect(core.completeTodo([], 'abc').ok).toBe(false);
    const r = core.completeTodo([{ id: 1, text: 'a', completed: false }], 2);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('not_found');
  });

  test('marks completed and handles already completed', () => {
    const todos = [{ id: 1, text: 'a', completed: false }];
    const r1 = core.completeTodo(todos, 1);
    expect(r1.ok).toBe(true);
    expect(r1.todo.completed).toBe(true);

    const r2 = core.completeTodo(r1.todos, 1);
    expect(r2.ok).toBe(true);
    expect(r2.alreadyCompleted).toBe(true);
  });
});

describe('core: removeTodo', () => {
  test('invalid id and not found', () => {
    expect(core.removeTodo([], 'zero').ok).toBe(false);
    const r = core.removeTodo([{ id: 1, text: 'a' }], 2);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('not_found');
  });

  test('removes by id and returns removedId', () => {
    const todos = [{ id: 1, text: 'a' }, { id: 2, text: 'b' }];
    const r = core.removeTodo(todos, 1);
    expect(r.ok).toBe(true);
    expect(r.removedId).toBe(1);
    expect(r.todos.map(t => t.id)).toEqual([2]);
  });
});

describe('core: toLocalISODate', () => {
  test('produces YYYY-MM-DD string for given Date', () => {
    const dt = new Date('2000-01-02T03:04:05.000Z');
    const s = core.toLocalISODate(dt);
    expect(/^\d{4}-\d{2}-\d{2}$/.test(s)).toBe(true);
  });
});


