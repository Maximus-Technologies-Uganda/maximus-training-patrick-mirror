const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const { transformSync } = require('esbuild');

describe('verify-node-version CLI', () => {
  const scriptPath = path.resolve(__dirname, '..', 'verify-node-version.ts');
  let compiledScript;
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-node-version-test-'));
    const source = fs.readFileSync(scriptPath, 'utf8');
    const { code } = transformSync(source, { loader: 'ts', format: 'esm' });
    compiledScript = path.join(tempDir, 'verify-node-version.mjs');
    fs.writeFileSync(compiledScript, code, 'utf8');
  });

  afterAll(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fails fast when provided an invalid version range', () => {
    const result = spawnSync(process.execPath, [compiledScript, '--range', 'abc'], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid version range format: abc');
  });

  it('throws a descriptive error when parsing an invalid Node version string', () => {
    const moduleUrl = pathToFileURL(compiledScript).href;
    const evalSnippet = `
      import { parseNodeVersion } from '${moduleUrl}';
      try {
        parseNodeVersion('abc');
        console.log('SHOULD_NOT_REACH');
      } catch (error) {
        console.log('ERROR:' + error.message);
      }
    `;

    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '--eval', evalSnippet],
      {
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('ERROR:Invalid Node.js version format: abc');
  });
});
