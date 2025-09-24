import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as JsonSchema from '@hyperjump/json-schema';
import '@hyperjump/json-schema/draft-2020-12';

const require = createRequire(import.meta.url);

async function main() {
  try {
    const specArg = process.argv[2];
    if (!specArg) {
      console.error('Usage: node scripts/validate-openapi.mjs <path-to-openapi.json>');
      process.exit(2);
      return;
    }

    const specPath = path.resolve(specArg);
    const raw = fs.readFileSync(specPath, 'utf-8');
    const doc = JSON.parse(raw);

    // Load OpenAPI 3.1 meta-schemas locally
    const OAS_SCHEMA = require('@apidevtools/openapi-schemas/schemas/v3.1/schema.json');
    const OAS_SCHEMA_BASE = require('@apidevtools/openapi-schemas/schemas/v3.1/schema-base.json');

    await JsonSchema.addSchema(OAS_SCHEMA);
    await JsonSchema.addSchema(OAS_SCHEMA_BASE);
    JsonSchema.setMetaSchemaOutputFormat(JsonSchema.DETAILED);

    const result = await JsonSchema.validate(OAS_SCHEMA.$id, doc, JsonSchema.DETAILED);
    if (!result.valid) {
      const message = (result.errors || [])
        .map((e) => `${e.instanceLocation || '(root)'} ${e.error}`)
        .join('\n');
      console.error(message);
      process.exit(1);
      return;
    }

    // Success
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
}

main();


