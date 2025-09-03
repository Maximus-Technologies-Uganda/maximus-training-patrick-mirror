const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const STATE_FILE = path.resolve(__dirname, '../stopwatch-state.json');

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function runCli(args) {
  const res = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    windowsHide: true,
  });
  return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function ms(h, m, s, ms) {
  return (((h * 60 + m) * 60 + s) * 1000) + ms;
}

function normalizeNewlines(s) {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/g, '\n');
}

describe('stopwatch export golden files', () => {
  test('populated state matches golden file', () => {
    const outPath = path.resolve(__dirname, 'jest-report.txt');
    try { fs.unlinkSync(outPath); } catch {}

    writeState({
      startTime: null,
      isRunning: false,
      elapsedTime: ms(0, 1, 2, 345),
      laps: [ms(0, 0, 30, 0), ms(0, 0, 20, 500), { duration: ms(0, 0, 11, 111) }]
    });

    const res = runCli(['export', `--out=${outPath}`]);
    expect(res.code).toBe(0);

    const actual = normalizeNewlines(fs.readFileSync(outPath, 'utf8'));
    const expected = normalizeNewlines(fs.readFileSync(path.resolve(__dirname, 'expected-laps.txt'), 'utf8'));
    expect(actual).toBe(expected);
  });

  test('empty state matches golden file', () => {
    const outPath = path.resolve(__dirname, 'jest-empty.txt');
    try { fs.unlinkSync(outPath); } catch {}

    writeState({ startTime: null, isRunning: false, elapsedTime: 0, laps: [] });
    const res = runCli(['export', `--out=${outPath}`]);
    expect(res.code).toBe(0);

    const actual = fs.existsSync(outPath) ? normalizeNewlines(fs.readFileSync(outPath, 'utf8')) : '';
    const expected = normalizeNewlines(fs.readFileSync(path.resolve(__dirname, 'expected-empty.txt'), 'utf8'));
    expect(actual.trim()).toBe(expected.trim());
  });
});


