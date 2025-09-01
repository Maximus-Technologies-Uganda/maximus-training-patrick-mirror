const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const DATA_FILE = path.resolve(__dirname, '../data/quotes.json');

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
    // Ensure data file exists and has sufficient quotes
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw);
    assert.ok(Array.isArray(arr) && arr.length >= 15, 'quotes.json should have at least 15 entries');

    const res = await runCli([]);
    assert.strictEqual(res.code, 0, 'random quote command should exit 0');
    assert.ok(/ - /.test(res.stdout.trim()), 'output should include "text - author"');
    console.log('PASS prints a random quote');
  } catch (err) {
    failures++;
    console.error('FAIL prints a random quote');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    const author = 'Steve Jobs';
    const res = await runCli([`--by=${author}`]);
    assert.strictEqual(res.code, 0, '--by author should exit 0 when matches exist');
    const out = res.stdout.trim();
    assert.ok(out.endsWith(`- ${author}`), 'output should end with the requested author');
    console.log('PASS filters quotes by author');
  } catch (err) {
    failures++;
    console.error('FAIL filters quotes by author');
    console.error(err && err.stack ? err.stack : err);
  }

  process.exitCode = failures ? 1 : 0;
})();


