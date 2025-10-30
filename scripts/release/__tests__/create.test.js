const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { transformSync } = require('esbuild');

describe('release create CLI', () => {
  const scriptPath = path.resolve(__dirname, '..', 'create.ts');
  let compiledScript;
  let tempScriptDir;

  beforeAll(() => {
    tempScriptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-create-test-'));
    const source = fs.readFileSync(scriptPath, 'utf8');
    const { code } = transformSync(source, { loader: 'ts', format: 'esm' });
    compiledScript = path.join(tempScriptDir, 'create.mjs');
    fs.writeFileSync(compiledScript, code, 'utf8');
  });

  afterAll(() => {
    if (tempScriptDir) {
      fs.rmSync(tempScriptDir, { recursive: true, force: true });
    }
  });

  it('rejects invalid semantic versions before performing side effects', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-cli-test-'));

    try {
      const result = spawnSync(
        process.execPath,
        [compiledScript, '--version', 'v8.0.0-invalid'],
        {
          encoding: 'utf8',
          cwd: tempDir,
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Invalid semantic version: v8.0.0-invalid');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
