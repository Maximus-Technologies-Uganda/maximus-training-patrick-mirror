#!/usr/bin/env tsx
/**
 * validate-openapi.ts
 * Validates canonical OpenAPI spec for production hardening requirements
 *
 * Usage:
 *   tsx scripts/validate-openapi.ts [--src path]
 *
 * Validations:
 *   - Unique operationIds across all paths
 *   - No global security block (per-op security only)
 *   - Required example payloads for 401/403/422/429/413/503
 *   - Servers include local/staging/prod
 *   - RequestId present in error examples
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation failures detected
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';
import yaml from 'yaml';

interface OpenAPIDocument {
  openapi: string;
  info: unknown;
  paths: Record<string, Record<string, Operation>>;
  servers?: Array<{ url: string; description?: string }>;
  security?: Array<Record<string, string[]>>;
  components?: {
    responses?: Record<string, Response>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Operation {
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  responses?: Record<string, ResponseRef>;
  [key: string]: unknown;
}

interface Response {
  description: string;
  content?: Record<string, ContentType>;
  [key: string]: unknown;
}

interface ContentType {
  schema?: unknown;
  example?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ResponseRef {
  $ref?: string;
  [key: string]: unknown;
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function main() {
  const { values } = parseArgs({
    options: {
      src: { type: 'string', default: 'specs/008-identity-platform/contracts/openapi.yaml' }
    }
  });

  const srcPath = path.resolve(process.cwd(), values.src!);

  if (!fs.existsSync(srcPath)) {
    console.error(`[ERROR] Source file not found: ${srcPath}`);
    process.exit(1);
  }

  const yamlContent = fs.readFileSync(srcPath, 'utf-8');
  let spec: OpenAPIDocument;

  try {
    spec = yaml.parse(yamlContent) as OpenAPIDocument;
  } catch (err) {
    console.error(`[ERROR] Failed to parse YAML: ${err}`);
    process.exit(1);
  }

  console.log('\n📋 Validating OpenAPI Specification...\n');

  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  };

  // Run all validations
  validateOperationIds(spec, result);
  validateNoGlobalSecurity(spec, result);
  validateErrorExamples(spec, result);
  validateServers(spec, result);
  validateRequestIdInExamples(spec, result);

  // Report results
  console.log('\n' + '='.repeat(60));

  if (result.errors.length > 0) {
    console.log('\n❌ VALIDATION FAILED\n');
    result.errors.forEach(err => console.error(`  ❌ ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS\n');
    result.warnings.forEach(warn => console.warn(`  ⚠️  ${warn}`));
  }

  if (result.errors.length === 0) {
    console.log('\n✅ ALL VALIDATIONS PASSED\n');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.log('\n' + '='.repeat(60) + '\n');
    process.exit(1);
  }
}

function validateOperationIds(spec: OpenAPIDocument, result: ValidationResult): void {
  const operationIds = new Set<string>();
  const duplicates = new Set<string>();

  for (const [_pathKey, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        const op = operation as Operation;
        if (op.operationId) {
          if (operationIds.has(op.operationId)) {
            duplicates.add(op.operationId);
          }
          operationIds.add(op.operationId);
        }
      }
    }
  }

  if (duplicates.size > 0) {
    result.passed = false;
    duplicates.forEach(id => {
      result.errors.push(`Duplicate operationId found: "${id}"`);
    });
  } else {
    console.log(`✅ Unique operationIds: ${operationIds.size} found`);
  }
}

function validateNoGlobalSecurity(spec: OpenAPIDocument, result: ValidationResult): void {
  if (spec.security && spec.security.length > 0) {
    result.passed = false;
    result.errors.push('Global security block is present - use per-operation security only');
  } else {
    console.log('✅ No global security block (per-operation security only)');
  }
}

function validateErrorExamples(spec: OpenAPIDocument, result: ValidationResult): void {
  const requiredErrorResponses = ['Err401', 'Err403', 'Err422', 'Err429', 'Err413', 'Err503'];
  const missingExamples: string[] = [];

  if (!spec.components?.responses) {
    result.passed = false;
    result.errors.push('Missing components.responses section');
    return;
  }

  for (const errCode of requiredErrorResponses) {
    const response = spec.components.responses[errCode] as Response | undefined;
    if (!response) {
      missingExamples.push(`${errCode}: response definition missing`);
      continue;
    }

    const jsonContent = response.content?.['application/json'];
    if (!jsonContent || !jsonContent.example) {
      missingExamples.push(`${errCode}: missing example payload`);
    }
  }

  if (missingExamples.length > 0) {
    result.passed = false;
    missingExamples.forEach(msg => {
      result.errors.push(`Error example missing: ${msg}`);
    });
  } else {
    console.log(`✅ All required error examples present (401/403/422/429/413/503)`);
  }
}

/**
 * Checks if a URL points to a local/development endpoint
 * Detects: localhost, 127.0.0.1, 0.0.0.0, ::1, *.local domains
 */
function isLocalUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Match localhost, loopback IPs (IPv4 and IPv6), and .local domains
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\.local(?::|\/|$)/.test(lower);
}

function validateServers(spec: OpenAPIDocument, result: ValidationResult): void {
  if (!spec.servers || spec.servers.length === 0) {
    result.passed = false;
    result.errors.push('No servers defined');
    return;
  }

  const serverUrls = spec.servers.map(s => s.url.toLowerCase());
  const hasLocal = serverUrls.some(url => isLocalUrl(url));
  const hasStaging = serverUrls.some(url => url.includes('staging') || url.includes('maximus-training'));
  const hasProd = serverUrls.some(url =>
    (url.includes('run.app') || url.includes('production')) &&
    !isLocalUrl(url)
  );

  if (!hasLocal) {
    result.warnings.push('No local server URL found');
  }
  if (!hasStaging && !hasProd) {
    result.passed = false;
    result.errors.push('No staging or production server URLs found');
  } else {
    console.log(`✅ Servers defined: ${spec.servers.length} (local: ${hasLocal}, remote: ${hasStaging || hasProd})`);
  }

  // Check for localhost in production
  if (process.env.NODE_ENV === 'production') {
    const hasLocalhostInProd = serverUrls.some(url => isLocalUrl(url));
    if (hasLocalhostInProd) {
      result.passed = false;
      result.errors.push('Localhost server URL found in production environment');
    }
  }
}

function validateRequestIdInExamples(spec: OpenAPIDocument, result: ValidationResult): void {
  const requiredErrorResponses = ['Err401', 'Err403', 'Err422', 'Err429', 'Err413', 'Err503'];
  const missingRequestId: string[] = [];

  if (!spec.components?.responses) {
    return; // Already reported in validateErrorExamples
  }

  for (const errCode of requiredErrorResponses) {
    const response = spec.components.responses[errCode] as Response | undefined;
    if (!response) continue;

    const jsonContent = response.content?.['application/json'];
    const example = jsonContent?.example as Record<string, unknown> | undefined;

    if (example && !example.requestId) {
      missingRequestId.push(errCode);
    }
  }

  if (missingRequestId.length > 0) {
    result.passed = false;
    missingRequestId.forEach(errCode => {
      result.errors.push(`${errCode}: example missing requestId field`);
    });
  } else {
    console.log('✅ All error examples include requestId field');
  }
}

main();