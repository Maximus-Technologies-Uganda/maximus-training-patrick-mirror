import { spawnSync } from 'child_process';
import path from 'path';

describe('OpenAPI 3.1 meta-schema validation', () => {
  it('api/openapi.json is a valid OpenAPI 3.1 document', () => {
    const script = path.resolve(__dirname, '..', 'scripts', 'validate-openapi.mjs');
    const spec = path.resolve(__dirname, '..', 'openapi.json');
    const proc = spawnSync(process.execPath, [script, spec], { encoding: 'utf-8' });
    if (proc.status !== 0) {
      throw new Error(`OpenAPI 3.1 schema validation failed:\n${proc.stderr || proc.stdout}`);
    }
  });
});


