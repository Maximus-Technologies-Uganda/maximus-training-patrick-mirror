const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const DATA_FILE = path.resolve(__dirname, '../todos.json');

function writeTodosFile(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2) + '\n', 'utf8');
}

function readTodosFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resetTodosFile() {
  writeTodosFile([]);
}

function getLocalISODate(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
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

async function testDueTodayRespectsLocalDateBoundaries() {
  resetTodosFile();
  const today = getLocalISODate(0);
  const yesterday = getLocalISODate(-1);
  const tomorrow = getLocalISODate(1);

  await runCli(['add', 'Today task', `--due=${today}`, '--priority=low']);
  await runCli(['add', 'Yesterday task', `--due=${yesterday}`, '--priority=medium']);
  await runCli(['add', 'Tomorrow task', `--due=${tomorrow}`, '--priority=high']);

  const res = await runCli(['list', '--dueToday']);
  assert.strictEqual(res.code, 0, 'list --dueToday should exit 0');
  const out = res.stdout;
  assert.ok(/Today task/.test(out), 'should include today task');
  assert.ok(!/Yesterday task/.test(out), 'should not include yesterday task');
  assert.ok(!/Tomorrow task/.test(out), 'should not include tomorrow task');
}

async function testDuplicateGuardRejectsSameText() {
  resetTodosFile();
  const textTokens = ['Same', 'exact', 'text'];

  const first = await runCli(['add', ...textTokens, '--priority=low']);
  assert.strictEqual(first.code, 0, 'first add should succeed');

  const second = await runCli(['add', ...textTokens, '--priority=high']);
  assert.notStrictEqual(second.code, 0, 'duplicate add should fail');
  assert.ok(/duplicate to-do/i.test(second.stderr), 'should print duplicate error');

  const todos = readTodosFile();
  assert.strictEqual(todos.length, 1, 'only one todo should exist after duplicate attempt');
}

(async function run() {
  let failures = 0;

  try {
    await testDueTodayRespectsLocalDateBoundaries();
    console.log('PASS list --dueToday respects local date boundaries');
  } catch (err) {
    failures++;
    console.error('FAIL list --dueToday respects local date boundaries');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    await testDuplicateGuardRejectsSameText();
    console.log('PASS duplicate guard rejects same text');
  } catch (err) {
    failures++;
    console.error('FAIL duplicate guard rejects same text');
    console.error(err && err.stack ? err.stack : err);
  }

  process.exitCode = failures ? 1 : 0;
})();


