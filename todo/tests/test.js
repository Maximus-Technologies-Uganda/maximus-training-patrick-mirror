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

async function testAddNewTodo() {
  resetTodosFile();
  const textTokens = ['Buy', 'milk'];
  const due = '2030-01-02';
  const priority = 'high';

  const result = await runCli(['add', ...textTokens, `--due=${due}`, `--priority=${priority}`]);
  assert.strictEqual(result.code, 0, 'add command should exit with code 0');
  assert.ok(/Added:/.test(result.stdout), 'add command should print confirmation');

  const todos = readTodosFile();
  assert.strictEqual(todos.length, 1, 'todos.json should have one entry');

  const added = todos[0];
  assert.strictEqual(added.text, textTokens.join(' '), 'text should match');
  assert.strictEqual(added.due, due, 'due date should match');
  assert.strictEqual(added.priority, priority, 'priority should match');
  assert.strictEqual(typeof added.createdAt, 'string', 'createdAt should be present');
  assert.strictEqual(added.completed, false, 'completed should be false by default');
}

async function testDuplicateGuard() {
  resetTodosFile();
  const textTokens = ['Pay', 'bills'];
  const due = '2031-05-10';

  const first = await runCli(['add', ...textTokens, `--due=${due}`, '--priority=medium']);
  assert.strictEqual(first.code, 0, 'first add should succeed');

  const second = await runCli(['add', ...textTokens, `--due=${due}`, '--priority=high']);
  assert.strictEqual(second.code, 1, 'second add with same text and due should fail');
  assert.ok(/duplicate to-do/i.test(second.stderr), 'duplicate error message should be printed');

  const todos = readTodosFile();
  assert.strictEqual(todos.length, 1, 'should still have only one todo after duplicate attempt');
}

async function testListDueToday() {
  resetTodosFile();
  const today = getLocalISODate();

  await runCli(['add', 'Task', 'today', `--due=${today}`, '--priority=low']);
  await runCli(['add', 'Task', 'tomorrow', '--due=2099-12-31', '--priority=high']);
  await runCli(['add', 'No', 'due', '--priority=medium']);

  const result = await runCli(['list', '--dueToday']);
  assert.strictEqual(result.code, 0, 'list --dueToday should exit with code 0');

  const out = result.stdout;
  assert.ok(/Task today/.test(out), 'output should include today task');
  assert.ok(!/Task tomorrow/.test(out), 'output should not include non-today task');
  assert.ok(!/No due/.test(out), 'output should not include tasks without today due');
}

async function testListHighPriority() {
  resetTodosFile();

  await runCli(['add', 'Important', 'task', '--priority=high', '--due=2099-01-01']);
  await runCli(['add', 'Less', 'important', '--priority=low', '--due=2099-01-01']);
  await runCli(['add', 'Medium', 'job', '--priority=medium']);

  const result = await runCli(['list', '--highPriority']);
  assert.strictEqual(result.code, 0, 'list --highPriority should exit with code 0');

  const out = result.stdout;
  assert.ok(/Important task/.test(out), 'output should include high priority item');
  assert.ok(!/Less important/.test(out), 'output should not include low priority item');
  assert.ok(!/Medium job/.test(out), 'output should not include medium priority item');
}

async function testListMutualExclusivity() {
  resetTodosFile();

  const result = await runCli(['list', '--dueToday', '--highPriority']);
  assert.strictEqual(result.code, 1, 'using both flags should exit with code 1');
  assert.ok(/cannot be used together/i.test(result.stderr), 'error message should mention mutual exclusivity');
}

(async function run() {
  const tests = [
    ['adds a new to-do correctly', testAddNewTodo],
    ['duplicate guard prevents same text+due', testDuplicateGuard],
    ['list filters by --dueToday', testListDueToday],
    ['list filters by --highPriority', testListHighPriority],
    ['list flags are mutually exclusive', testListMutualExclusivity],
    ['completing invalid ID exits non-zero', async function testCompleteInvalidId() {
      resetTodosFile();
      const res1 = await runCli(['complete', 'abc']);
      assert.notStrictEqual(res1.code, 0, 'non-numeric ID should exit non-zero');
      assert.ok(/valid numeric id/i.test(res1.stderr), 'should print numeric ID error');

      const res2 = await runCli(['complete', '9999']);
      assert.notStrictEqual(res2.code, 0, 'unknown ID should exit non-zero');
      assert.ok(/to-do not found/i.test(res2.stderr), 'should print not found error');
    }],
    ['remove by id deletes the to-do', async function testRemoveById() {
      resetTodosFile();
      await runCli(['add', 'Temp', 'task', '--priority=low']);
      let todos = readTodosFile();
      assert.strictEqual(todos.length, 1, 'precondition: one todo present');
      const id = todos[0].id;

      const res = await runCli(['remove', String(id)]);
      assert.strictEqual(res.code, 0, 'remove should exit with code 0');

      todos = readTodosFile();
      assert.strictEqual(todos.length, 0, 'todo should be removed from file');
    }]
  ];

  let failures = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (err) {
      failures++;
      console.error(`FAIL ${name}`);
      console.error(err && err.stack ? err.stack : err);
    }
  }

  process.exitCode = failures ? 1 : 0;
})();
