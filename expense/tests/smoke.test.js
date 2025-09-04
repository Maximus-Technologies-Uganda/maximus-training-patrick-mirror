const path = require('path');
const { spawnSync } = require('child_process');

describe('expense CLI smoke', () => {
  test('report with valid month exits 0 (entrypoint smoke)', () => {
    const CLI = path.resolve(__dirname, '../src/index.js');
    const cwd = path.resolve(__dirname, '..');
    const res = spawnSync(process.execPath, [CLI, 'report', '--month=1970-01'], { encoding: 'utf8', cwd, windowsHide: true });
    expect(res.status).toBe(0);
    expect((res.stdout || '').toLowerCase()).toContain('no expenses found');
  });
});
