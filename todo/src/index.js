const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'todos.json');

function readTodos() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTodos(todos) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error('Error: failed to write todos.json:', err.message);
    process.exitCode = 1;
  }
}

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

  return { text: textParts.join(' ').trim(), due, priority };
}

function generateId(todos) {
  let max = 0;
  for (const t of todos) {
    if (typeof t.id === 'number' && t.id > max) max = t.id;
  }
  return max + 1;
}

function handleAdd() {
  const argv = process.argv.slice(3);
  const { text, due, priority } = parseAddArgs(argv);

  if (!text) {
    console.error('Error: to-do text is required.');
    process.exitCode = 1;
    return;
  }

  if (!validateDue(due)) {
    console.error('Error: --due must be a real date in YYYY-MM-DD format.');
    process.exitCode = 1;
    return;
  }

  if (!['low', 'medium', 'high'].includes(priority)) {
    console.error('Error: --priority must be one of low|medium|high.');
    process.exitCode = 1;
    return;
  }

  const todos = readTodos();

  const isDuplicate = todos.some(t =>
    String(t.text || '').trim().toLowerCase() === text.toLowerCase() &&
    String(t.due || null) === String(due || null)
  );

  if (isDuplicate) {
    console.error('Error: duplicate to-do with the same text and due date already exists.');
    process.exitCode = 1;
    return;
  }

  const newTodo = {
    id: generateId(todos),
    text,
    due: due || null,
    priority,
    createdAt: new Date().toISOString(),
    completed: false
  };

  todos.push(newTodo);
  writeTodos(todos);

  console.log(`Added: "${newTodo.text}"${newTodo.due ? ' (due ' + newTodo.due + ')' : ''} [priority: ${newTodo.priority}]`);
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

function getLocalISODate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function handleList() {
  const argv = process.argv.slice(3);
  const { dueToday, highPriority } = parseListArgs(argv);

  if (dueToday && highPriority) {
    console.error('Error: --dueToday and --highPriority cannot be used together.');
    process.exitCode = 1;
    return;
  }

  const todos = readTodos();
  let results = todos.slice();

  if (dueToday) {
    const today = getLocalISODate();
    results = results.filter(t => (t.due || null) === today);
  } else if (highPriority) {
    results = results.filter(t => String(t.priority || '').toLowerCase() === 'high');
  }

  if (results.length === 0) {
    console.log('No to-dos found.');
    return;
  }

  for (const t of results) {
    const status = t.completed ? '✓' : ' ';
    console.log(`[${status}] #${t.id} ${t.text}${t.due ? ' (due ' + t.due + ')' : ''} [${t.priority || 'medium'}]`);
  }
}

if (process.argv[2] === 'list') {
  handleList();
}

if (process.argv[2] === 'add') {
  handleAdd();
}

function handleComplete() {
  const argv = process.argv.slice(3);
  const idRaw = argv[0];
  const id = Number(idRaw);

  if (!Number.isInteger(id) || id <= 0) {
    console.error('Error: a valid numeric ID is required.');
    process.exitCode = 1;
    return;
  }

  const todos = readTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) {
    console.error('Error: to-do not found.');
    process.exitCode = 1;
    return;
  }

  if (todo.completed) {
    console.log('Already completed.');
    return;
  }

  todo.completed = true;
  writeTodos(todos);
  console.log(`Completed #${id}: ${todo.text}`);
}

if (process.argv[2] === 'complete') {
  handleComplete();
}

function handleRemove() {
  const argv = process.argv.slice(3);
  const idRaw = argv[0];
  const id = Number(idRaw);

  if (!Number.isInteger(id) || id <= 0) {
    console.error('Error: a valid numeric ID is required.');
    process.exitCode = 1;
    return;
  }

  const todos = readTodos();
  const next = todos.filter(t => t.id !== id);
  if (next.length === todos.length) {
    console.error('Error: to-do not found.');
    process.exitCode = 1;
    return;
  }

  writeTodos(next);
  console.log(`Removed #${id}`);
}

if (process.argv[2] === 'remove') {
  handleRemove();
}