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

async function testExportWithLaps() {
  const outPath = path.resolve(__dirname, 'report.txt');
  removeFileIfExists(outPath);

  writeState({
    startTime: Date.now() - 10000,
    isRunning: false,
    elapsedTime: ms(0, 1, 2, 345),
    laps: [ms(0, 0, 30, 0), ms(0, 0, 20, 500), { duration: ms(0, 0, 11, 111) }]
  });

  const result = await runCli(['export', `--out=${outPath}`]);
  assert.strictEqual(result.code, 0, 'export should exit with code 0');
  assert.ok(/Exported stopwatch report/i.test(result.stdout), 'should print exported path');

  const content = fs.readFileSync(outPath, 'utf8');
  const lines = content.trim().split(/\r?\n/);
  assert.ok(/^Total:\s+\d{2}:\d{2}:\d{2}\.\d{3}$/.test(lines[0]), 'first line should be Total with formatted time');
  assert.ok(/^Lap 1:\s+\d{2}:\d{2}:\d{2}\.\d{3}$/.test(lines[1]), 'Lap 1 line present');
  assert.ok(/^Lap 2:\s+\d{2}:\d{2}:\d{2}\.\d{3}$/.test(lines[2]), 'Lap 2 line present');
  assert.ok(/^Lap 3:\s+\d{2}:\d{2}:\d{2}\.\d{3}$/.test(lines[3]), 'Lap 3 line present');
}

async function testExportNoLaps() {
  const outPath = path.resolve(__dirname, 'nolaps.txt');
  removeFileIfExists(outPath);

  writeState({ startTime: Date.now(), isRunning: false, elapsedTime: 0, laps: [] });

  const result = await runCli(['export', `--out=${outPath}`]);
  assert.strictEqual(result.code, 0, 'export with no laps should exit code 0');
  assert.ok(/No laps recorded\./i.test(result.stdout), 'should print "No laps recorded."');
  assert.strictEqual(fs.existsSync(outPath), false, 'no output file should be created');
}

(async function run() {
  const tests = [
    ['export with laps writes file and lines', testExportWithLaps],
    ['export with no laps prints message and no file', testExportNoLaps],
    ['lap before start exits non-zero with error', async function testLapBeforeStart() {
      // Ensure state is not started
      writeState({ startTime: null, isRunning: false, elapsedTime: 0, laps: [] });
      const res = await runCli(['lap']);
      assert.notStrictEqual(res.code, 0, 'lap before start should exit non-zero');
      assert.ok(/stopwatch has not been started/i.test(res.stderr), 'should print not-started error');
    }],
    ['reset clears stopwatch-state.json', async function testResetClearsState() {
      // Seed a non-empty state
      writeState({ startTime: Date.now(), isRunning: true, elapsedTime: 1234, laps: [100, 200] });
      const res = await runCli(['reset']);
      assert.strictEqual(res.code, 0, 'reset should exit with code 0');

      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      assert.strictEqual(parsed.startTime, null, 'startTime should be null');
      assert.strictEqual(parsed.isRunning, false, 'isRunning should be false');
      assert.strictEqual(parsed.elapsedTime, 0, 'elapsedTime should be 0');
      assert.ok(Array.isArray(parsed.laps) && parsed.laps.length === 0, 'laps should be an empty array');
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
