const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.resolve(__dirname, '../src/index.js');
const DATA = path.resolve(__dirname, '../todos.json');

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
}

describe('CLI smoke', () => {
  beforeEach(() => {
    fs.writeFileSync(DATA, '[]\n', 'utf8');
  });

  test('add then duplicate exits non-zero', () => {
    const ok = run(['add', 'One']);
    expect(ok.status).toBe(0);
    const dup = run(['add', 'one']);
    expect(dup.status).not.toBe(0);
    expect((dup.stderr || '').toLowerCase()).toContain('duplicate');
  });
});
