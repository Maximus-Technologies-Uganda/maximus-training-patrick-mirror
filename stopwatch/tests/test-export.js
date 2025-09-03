const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const STATE_FILE = path.resolve(__dirname, '../stopwatch-state.json');

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function removeFileIfExists(p) {
  try { fs.unlinkSync(p); } catch {}
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

function ms(h, m, s, ms) {
  return (((h * 60 + m) * 60 + s) * 1000) + ms;
}

(async function run() {
  let failures = 0;

  // Populated state golden test
  const outPath = path.resolve(__dirname, 'report.txt');
  removeFileIfExists(outPath);
  try {
    writeState({
      startTime: null,
      isRunning: false,
      elapsedTime: ms(0, 1, 2, 345),
      laps: [ms(0, 0, 30, 0), ms(0, 0, 20, 500), { duration: ms(0, 0, 11, 111) }]
    });

    const result = await runCli(['export', `--out=${outPath}`]);
    assert.strictEqual(result.code, 0, 'export should exit 0');

    const actualRaw = fs.readFileSync(outPath, 'utf8');
    const expectedRaw = fs.readFileSync(path.resolve(__dirname, 'expected-laps.txt'), 'utf8');
    const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/g, '\n');
    const actual = normalize(actualRaw);
    const expected = normalize(expectedRaw);
    assert.strictEqual(actual, expected, 'export output should match golden file');
    console.log('PASS export output matches expected golden file');
  } catch (err) {
    failures++;
    console.error('FAIL export output matches expected golden file');
    console.error(err && err.stack ? err.stack : err);
  }

  // Empty state golden test (headers-only)
  const emptyOut = path.resolve(__dirname, 'empty-report.txt');
  removeFileIfExists(emptyOut);
  try {
    writeState({ startTime: null, isRunning: false, elapsedTime: 0, laps: [] });
    const result = await runCli(['export', `--out=${emptyOut}`]);
    assert.strictEqual(result.code, 0, 'export with empty state should exit 0');

    const actualRaw = fs.existsSync(emptyOut) ? fs.readFileSync(emptyOut, 'utf8') : '';
    const expectedRaw = fs.readFileSync(path.resolve(__dirname, 'expected-empty.txt'), 'utf8');
    const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/g, '\n');
    const actual = normalize(actualRaw);
    const expected = normalize(expectedRaw);
    assert.strictEqual(actual, expected, 'empty export output should match empty golden file');
    console.log('PASS export empty state matches expected golden file');
  } catch (err) {
    failures++;
    console.error('FAIL export empty state matches expected golden file');
    console.error(err && err.stack ? err.stack : err);
  }

  process.exitCode = failures ? 1 : 0;
})();


