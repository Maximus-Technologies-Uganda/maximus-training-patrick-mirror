const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const DATA_FILE = path.resolve(__dirname, '../todos.json');

function readTodosFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTodosFile(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2) + '\n', 'utf8');
}

function resetTodosFile() {
  writeTodosFile([]);
}

function getLocalISODate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function runCli(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      cwd: options.cwd || path.resolve(__dirname, '..')
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function testAddWithPriority() {
  resetTodosFile();
  const due = '2099-01-01';
  const res = await runCli(['add', 'Prioritized', 'task', `--due=${due}`, '--priority=high']);
  assert.strictEqual(res.code, 0, 'add should exit 0');
  assert.ok(/Added:/i.test(res.stdout), 'confirmation should be printed');

  const todos = readTodosFile();
  assert.strictEqual(todos.length, 1, 'one todo should be saved');
  assert.strictEqual(todos[0].priority, 'high', 'priority should be saved as high');
  assert.strictEqual(todos[0].due, due, 'due date should be saved');
}

async function testListDueToday() {
  resetTodosFile();
  const today = getLocalISODate();
  await runCli(['add', 'Today', 'only', `--due=${today}`, '--priority=low']);
  await runCli(['add', 'Tomorrow', 'not-included', '--due=2099-12-31', '--priority=medium']);

  const res = await runCli(['list', '--dueToday']);
  assert.strictEqual(res.code, 0, 'list --dueToday should exit 0');
  const out = res.stdout;
  assert.ok(/Today only/.test(out), 'should include today task');
  assert.ok(!/Tomorrow not-included/.test(out), 'should exclude non-today task');
}

async function testDuplicateGuard() {
  resetTodosFile();
  const due = '2035-12-01';
  const text = ['Same', 'text'];
  const first = await runCli(['add', ...text, `--due=${due}`, '--priority=low']);
  assert.strictEqual(first.code, 0, 'first add should succeed');

  const second = await runCli(['add', ...text, `--due=${due}`, '--priority=high']);
  assert.notStrictEqual(second.code, 0, 'duplicate add should exit non-zero');
  assert.ok(/duplicate/i.test(second.stderr), 'should print duplicate error');

  const todos = readTodosFile();
  assert.strictEqual(todos.length, 1, 'only one todo should exist');
}

(async function run() {
  let failures = 0;

  try {
    await testAddWithPriority();
    console.log('PASS add accepts priority and due date');
  } catch (err) {
    failures++;
    console.error('FAIL add accepts priority and due date');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    await testListDueToday();
    console.log('PASS list supports --dueToday');
  } catch (err) {
    failures++;
    console.error('FAIL list supports --dueToday');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    await testDuplicateGuard();
    console.log('PASS duplicate guard blocks same text + due');
  } catch (err) {
    failures++;
    console.error('FAIL duplicate guard blocks same text + due');
    console.error(err && err.stack ? err.stack : err);
  }

  process.exitCode = failures ? 1 : 0;
})();


