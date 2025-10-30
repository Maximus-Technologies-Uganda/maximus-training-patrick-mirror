const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { transformSync } = require('esbuild');

describe('check-checklist-evidence CLI', () => {
  const scriptPath = path.resolve(__dirname, '..', 'check-checklist-evidence.ts');
  let compiledScript;
  let tempScriptDir;

  beforeAll(() => {
    tempScriptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-evidence-test-'));
    const source = fs.readFileSync(scriptPath, 'utf8');
    const { code } = transformSync(source, { loader: 'ts', format: 'esm' });
    compiledScript = path.join(tempScriptDir, 'check-checklist-evidence.mjs');
    fs.writeFileSync(compiledScript, code, 'utf8');
  });

  afterAll(() => {
    if (tempScriptDir) {
      fs.rmSync(tempScriptDir, { recursive: true, force: true });
    }
  });

  it('fails when required artifacts are missing from the packet manifest', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-cli-test-'));
    const packetDir = path.join(tempDir, 'packet');
    fs.mkdirSync(packetDir, { recursive: true });
    fs.writeFileSync(
      path.join(packetDir, 'manifest.json'),
      JSON.stringify({
        artifacts: [
          { name: 'contracts', exists: false },
          { name: 'a11y', exists: false },
        ],
      }),
      'utf8',
    );

    const prBody = '- [x] Release checklist item (DEV-123)';

    try {
      const result = spawnSync(
        process.execPath,
        [compiledScript, '--pr-body', prBody],
        {
          encoding: 'utf8',
          cwd: tempDir,
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Missing artifacts');
      expect(result.stderr).toContain('contracts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
