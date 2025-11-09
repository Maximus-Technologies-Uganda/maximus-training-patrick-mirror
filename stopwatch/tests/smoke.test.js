/* minimal smoke test to verify jest wiring */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.resolve(__dirname, '../src/index.js');

function run(args) {
  // Clear JEST_WORKER_ID to ensure the subprocess actually exits with the proper code
  // (not just return from exitWithError)
  const env = { ...process.env };
  delete env.JEST_WORKER_ID;
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
    env,
    windowsHide: true,
  });
}

describe('smoke', () => {
  test('wires up jest', () => {
    expect(1 + 1).toBe(2);
  });

  test('export validates --out path', () => {
    const invalidPath = '/nonexistent/directory/output.txt';
    const res = run(['export', `--out=${invalidPath}`]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Cannot access directory');
  });
});
