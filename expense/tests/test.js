const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const DATA_FILE = path.resolve(__dirname, '../expenses.json');

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

(async function run() {
  let failures = 0;

  try {
    const res = await runCli(['report', '--month=2025-13']);
    assert.notStrictEqual(res.code, 0, 'exit code should be non-zero for invalid month');
    assert.ok(/\bError:.*month.*YYYY-MM.*valid month/i.test(res.stderr), 'should print a clear month format error');
    console.log('PASS invalid report month exits non-zero with error message');
  } catch (err) {
    failures++;
    console.error('FAIL invalid report month exits non-zero with error message');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    // Seed expenses file with dummy data
    fs.writeFileSync(DATA_FILE, JSON.stringify([{ id: 1, amount: 10, category: 'test' }], null, 2) + '\n', 'utf8');

    // Execute clear command
    const res = await runCli(['clear']);
    assert.strictEqual(res.code, 0, 'clear should exit with code 0');

    // Verify file is emptied
    const contents = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = contents.trim() ? JSON.parse(contents) : [];
    assert.ok(Array.isArray(parsed), 'expenses.json should contain an array');
    assert.strictEqual(parsed.length, 0, 'expenses.json should be emptied by clear command');
    console.log('PASS clear command empties expenses.json');
  } catch (err) {
    failures++;
    console.error('FAIL clear command empties expenses.json');
    console.error(err && err.stack ? err.stack : err);
  }

  process.exitCode = failures ? 1 : 0;
})();
