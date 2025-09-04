#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const core = require('../src/core');

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
    console.error(`Error: failed to write todos.json: ${err.message}`);
    process.exit(1);
  }
}

function handleAdd() {
  const argv = process.argv.slice(3);
  const { text, due, priority } = core.parseAddArgs(argv);

  const todos = readTodos();
  const result = core.addTodo(todos, { text, due, priority }, new Date());
  if (!result.ok) {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }

  writeTodos(result.todos);
  const t = result.todo;
  console.log(`Added: "${t.text}"${t.due ? ' (due ' + t.due + ')' : ''} [priority: ${t.priority}]`);
}

function handleList() {
  const argv = process.argv.slice(3);
  const { dueToday, highPriority } = core.parseListArgs(argv);

  const todos = readTodos();
  const todayISO = core.toLocalISODate(new Date());
  const result = core.listTodos(todos, { dueToday, highPriority }, todayISO);
  if (!result.ok) {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }

  let results = result.results;
  if (results.length === 0) {
    console.log('No to-dos found.');
    return;
  }

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  results.sort((a, b) => {
    const aPri = priorityOrder[a.priority || 'medium'] || 2;
    const bPri = priorityOrder[b.priority || 'medium'] || 2;
    return bPri - aPri;
  });

  for (const t of results) {
    const status = t.completed ? '✓' : ' ';
    console.log(`[${status}] #${t.id} ${t.text}${t.due ? ' (due ' + t.due + ')' : ''} [${t.priority || 'medium'}]`);
  }
}

function handleComplete() {
  const argv = process.argv.slice(3);
  const idRaw = argv[0];
  const todos = readTodos();
  const result = core.completeTodo(todos, idRaw);
  if (!result.ok) {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }
  if (result.alreadyCompleted) {
    console.log('Already completed.');
    return;
  }
  writeTodos(result.todos);
  console.log(`Completed #${result.todo.id}: ${result.todo.text}`);
}

function handleRemove() {
  const argv = process.argv.slice(3);
  const idRaw = argv[0];
  const todos = readTodos();
  const result = core.removeTodo(todos, idRaw);
  if (!result.ok) {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }
  writeTodos(result.todos);
  console.log(`Removed #${result.removedId}`);
}

function main() {
  const command = process.argv[2];

  if (command === 'add') {
    handleAdd();
  } else if (command === 'list') {
    handleList();
  } else if (command === 'complete') {
    handleComplete();
  } else if (command === 'remove') {
    handleRemove();
  } else {
    console.error('Usage: todo <command>');
    console.error('Commands: add, list, complete, remove');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
