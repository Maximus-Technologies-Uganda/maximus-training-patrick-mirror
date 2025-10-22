#!/usr/bin/env node
/**
 * check-secret-patterns.js
 * Validates that .env.example files don't contain real secrets
 * 
 * Checks:
 * - FIREBASE_ADMIN_PRIVATE_KEY must be the safe placeholder
 * - No real private keys (checks for MII prefix and length)
 * - All required keys are present
 * 
 * Usage: node scripts/quality-gate/check-secret-patterns.js
 * Exit: 0 if valid, 1 if secrets detected or required keys missing
 */

const fs = require('node:fs');
const path = require('node:path');

const SAFE_PLACEHOLDER = '"-----BEGIN PRIVATE KEY-----\n<key>\n-----END PRIVATE KEY-----\n"';

// Required environment variables for API
const REQUIRED_API_KEYS = [
  'PORT',
  'SESSION_SECRET',
  'READ_ONLY',
  'IDENTITY_ENABLED',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'ALLOW_ORIGIN',
  'ALLOW_CREDENTIALS',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY'
];

// Required environment variables for frontend
const REQUIRED_FRONTEND_KEYS = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

function checkEnvFile(filePath, requiredKeys, description) {
  console.log(`\n[CHECK] Checking ${description}: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const foundKeys = new Set();
  let hasErrors = false;

  // Parse environment variables
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match) {
      foundKeys.add(match[1]);
    }
  }

  // Check for required keys
  const missingKeys = requiredKeys.filter(key => !foundKeys.has(key));
  if (missingKeys.length > 0) {
    console.error(`[FAIL] Missing required keys: ${missingKeys.join(', ')}`);
    hasErrors = true;
  } else {
    console.log(`[PASS] All required keys present (${requiredKeys.length} keys)`);
  }

  // Check that placeholder is used correctly
  if (content.includes('FIREBASE_ADMIN_PRIVATE_KEY')) {
    if (!content.includes('<key>')) {
      console.error('[FAIL] FIREBASE_ADMIN_PRIVATE_KEY must use placeholder: <key>');
      hasErrors = true;
    } else {
      // Check for real private key patterns (base64 content after BEGIN)
      // Real keys have MII after BEGIN, placeholder has <key>
      const realKeyPattern = /FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n[A-Za-z0-9+/=]{20,}/;
      if (realKeyPattern.test(content)) {
        console.error('[FAIL] Detected real private key! Use placeholder: <key>');
        hasErrors = true;
      }
    }
  }

  // Check for MII prefix (Base64-encoded private keys start with MII)
  if (content.includes('MII') && !content.includes('<key>')) {
    console.error('[FAIL] Detected Base64-encoded key (starts with MII)');
    hasErrors = true;
  }

  // Check that placeholder matches the safe pattern
  if (content.includes('FIREBASE_ADMIN_PRIVATE_KEY') &&
      content.includes(SAFE_PLACEHOLDER)) {
    console.log('[PASS] Safe placeholder detected for FIREBASE_ADMIN_PRIVATE_KEY');
  }

  if (!hasErrors) {
    console.log(`[PASS] ${description} passes secret pattern checks`);
  }

  return !hasErrors;
}

function main() {
  console.log('=== Secret Pattern Checker ===');
  
  const apiEnv = path.resolve(__dirname, '../../api/.env.example');
  const frontendEnv = path.resolve(__dirname, '../../frontend-next/.env.example');

  const apiValid = checkEnvFile(apiEnv, REQUIRED_API_KEYS, 'API .env.example');
  const frontendValid = checkEnvFile(frontendEnv, REQUIRED_FRONTEND_KEYS, 'Frontend .env.example');

  console.log('\n=== Summary ===');
  if (apiValid && frontendValid) {
    console.log('[OK] All .env.example files are valid');
    process.exit(0);
  } else {
    console.error('[FAIL] Secret pattern validation failed');
    console.error('   Fix the issues above and re-run this check');
    process.exit(1);
  }
}

main();
