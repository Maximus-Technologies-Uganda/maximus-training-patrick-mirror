// Core pure functions for the To-Do application

const PRIORITIES = ['low', 'medium', 'high'];

function validateDue(due) {
  if (due == null || due === '') return true;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function parseAddArgs(argv) {
  let due = null;
  let priority = 'medium';
  const textParts = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--due=')) {
      due = token.slice('--due='.length);
    } else if (token === '--due') {
      due = argv[++i];
    } else if (token.startsWith('--priority=')) {
      priority = token.slice('--priority='.length).toLowerCase();
    } else if (token === '--priority') {
      priority = (argv[++i] || '').toLowerCase();
    } else {
      textParts.push(token);
    }
  }

  const text = textParts.join(' ').replace(/\s+/g, ' ').trim();
  return { text, due, priority };
}

function parseListArgs(argv) {
  let dueToday = false;
  let highPriority = false;

  for (const token of argv) {
    if (token === '--dueToday') {
      dueToday = true;
    } else if (token === '--highPriority') {
      highPriority = true;
    }
  }

  return { dueToday, highPriority };
}

function toLocalISODate(now) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId(todos) {
  let max = 0;
  for (const t of todos) {
    if (typeof t.id === 'number' && t.id > max) max = t.id;
  }
  return max + 1;
}

function isDuplicate(todos, rawText) {
  const normalizedText = String(rawText || '').trim().toLowerCase();
  return todos.some(t => String(t.text || '').trim().toLowerCase() === normalizedText);
}

function addTodo(todos, { text, due, priority }, now = new Date()) {
  if (!text) {
    return { ok: false, error: 'missing_text', message: 'to-do text is required.' };
  }
  if (!validateDue(due)) {
    return { ok: false, error: 'invalid_due', message: '--due must be a real date in YYYY-MM-DD format.' };
  }
  if (!PRIORITIES.includes(String(priority || '').toLowerCase())) {
    return { ok: false, error: 'invalid_priority', message: '--priority must be one of low|medium|high.' };
  }
  if (isDuplicate(todos, text)) {
    return { ok: false, error: 'duplicate', message: 'duplicate to-do with the same text already exists.' };
  }

  const next = todos.slice();
  const newTodo = {
    id: generateId(next),
    text,
    due: due || null,
    priority: String(priority || 'medium').toLowerCase(),
    createdAt: now.toISOString(),
    completed: false,
  };
  next.push(newTodo);
  return { ok: true, todos: next, todo: newTodo };
}

function filterTodos(todos, { dueToday, highPriority }, todayISO) {
  let results = todos.slice();
  if (dueToday) {
    results = results.filter(t => (t.due || null) === todayISO);
  } else if (highPriority) {
    results = results.filter(t => String(t.priority || '').toLowerCase() === 'high');
  }
  return results;
}

function listTodos(todos, { dueToday, highPriority }, todayISO) {
  if (dueToday && highPriority) {
    return { ok: false, error: 'mutually_exclusive', message: '--dueToday and --highPriority cannot be used together.' };
  }
  const results = filterTodos(todos, { dueToday, highPriority }, todayISO);
  return { ok: true, results };
}

function completeTodo(todos, id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { ok: false, error: 'invalid_id', message: 'a valid numeric ID is required.' };
  }
  const next = todos.slice();
  const todo = next.find(t => t.id === numericId);
  if (!todo) {
    return { ok: false, error: 'not_found', message: 'to-do not found.' };
  }
  if (todo.completed) {
    return { ok: true, alreadyCompleted: true, todos: next, todo };
  }
  todo.completed = true;
  return { ok: true, todos: next, todo };
}

function removeTodo(todos, id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { ok: false, error: 'invalid_id', message: 'a valid numeric ID is required.' };
  }
  const next = todos.filter(t => t.id !== numericId);
  if (next.length === todos.length) {
    return { ok: false, error: 'not_found', message: 'to-do not found.' };
  }
  return { ok: true, todos: next, removedId: numericId };
}

module.exports = {
  PRIORITIES,
  validateDue,
  parseAddArgs,
  parseListArgs,
  toLocalISODate,
  generateId,
  isDuplicate,
  addTodo,
  filterTodos,
  listTodos,
  completeTodo,
  removeTodo,
};


