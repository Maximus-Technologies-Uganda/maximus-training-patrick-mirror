/* c8 ignore start */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');
const core = require('../src/core');

const CLI = path.resolve(__dirname, '../src/index.js');
const DATA = path.resolve(__dirname, '../todos.json');

function writeTodosFile(todos) {
  fs.writeFileSync(DATA, JSON.stringify(todos, null, 2) + '\n', 'utf8');
}

function resetTodos() {
  writeTodosFile([]);
}

function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: path.resolve(__dirname, '..'), windowsHide: true });
}

async function run() {
  let failures = 0;

  function step(name, fn) {
    try {
      fn();
      console.log(`PASS ${name}`);
    } catch (err) {
      failures++;
      console.error(`FAIL ${name}`);
      console.error(err && err.stack ? err.stack : String(err));
    }
  }

  step('core: dueToday boundaries', () => {
    const today = '2025-04-01';
    const todos = [
      { id: 1, text: 'y', due: '2025-03-31', priority: 'medium', completed: false },
      { id: 2, text: 't', due: today, priority: 'medium', completed: false },
      { id: 3, text: 'tm', due: '2025-04-02', priority: 'medium', completed: false },
    ];
    const r = core.listTodos(todos, { dueToday: true, highPriority: false }, today);
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.results.map(t => t.text), ['t']);
  });

  step('core: highPriority filter', () => {
    const todos = [
      { id: 1, text: 'a', priority: 'low' },
      { id: 2, text: 'b', priority: 'HIGH' },
      { id: 3, text: 'c', priority: 'medium' },
    ];
    const r = core.listTodos(todos, { dueToday: false, highPriority: true }, '2000-01-01');
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.results.map(t => t.id), [2]);
  });

  step('core: duplicate rule on add', () => {
    const todos = [{ id: 1, text: 'Pay Bill' }];
    const r = core.addTodo(todos, { text: ' pay bill ', due: null, priority: 'low' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'duplicate');
  });

  step('CLI smoke: duplicate exits non-zero', () => {
    resetTodos();
    const first = runCli(['add', 'One']);
    assert.strictEqual(first.status, 0);
    const dup = runCli(['add', 'one']);
    assert.notStrictEqual(dup.status, 0);
    assert.ok((dup.stderr || '').toLowerCase().includes('duplicate'));
  });

  process.exitCode = failures ? 1 : 0;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});



/* c8 ignore stop */
