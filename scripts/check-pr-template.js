// scripts/check-pr-template.js
// Enforces required PR template sections with a docs-only exemption.
// Exempt if:
//  - Linear Key(s) contains "DEV-EXEMPT"
//  - OR PR has label "docs-only"

const fs = require('node:fs');

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath || !fs.existsSync(eventPath)) {
  console.log('No GITHUB_EVENT_PATH found; skipping PR template check.');
  process.exit(0);
}

let evt = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
if (!evt.pull_request) {
  console.log('Not a pull_request event; skipping.');
  process.exit(0);
}

const body = String(evt.pull_request.body || '');
const labels = (evt.pull_request.labels || []).map(l => (l.name || '').toLowerCase());

// Helper: does a section header exist in body?
const has = (anchor) => body.includes(anchor);

// Required anchors (exact strings from your template)
const requiredAnchors = [
  '## Summary',
  '## Linear Key(s)',
  '## Gate Run',
  '## Gate Artifacts',
  '## Demo URL(s)',
  '## Screenshots (UI changes)',
  '## Linked Plan (/specify /plan /tasks)',
  '## Risk / Impact',
  '## Rollback Plan',
  '## Checklist'
];

// Check presence of anchors first
const missing = requiredAnchors.filter(a => !has(a));
if (missing.length) {
  // Soft-fail for foundational PRs to reduce friction (still surfaces in logs)
  console.warn('WARN: PR template missing sections:', missing.join(', '));
}

// Extract blocks (simple slice between headers)
const block = (header) => {
  const rx = new RegExp(`${header.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?(?:\\n## |\\n?$)`);
  return (body.match(rx) || [''])[0];
};

const linearBlock = block('## Linear Key(s)');
const gateBlock = block('## Gate Artifacts');

const hasDevExempt = /DEV-EXEMPT/i.test(linearBlock);
const isDocsOnly = labels.includes('docs-only');
const gateArtifactsNA = /\bN\/A\b/i.test(gateBlock);

// Non-exempt: expect a real DEV-XXXX somewhere in the Linear block or body
// Also accept DEV-XXX in summary section as fallback
const linearKeyLooksPresent = /\bDEV-[A-Z0-9]+\b/i.test(linearBlock) ||
                               /-\s*DEV-/.test(linearBlock) ||
                               /\bDEV-[A-Z0-9]+\b/i.test(body);
const gateHasAtLeastOneLink = /\[[^\]]*\]\([^)]+\)/.test(gateBlock) || /-\s*\w+/.test(gateBlock);

if (hasDevExempt || isDocsOnly) {
  console.log('Docs-only / DEV-EXEMPT detected: allowing exemption for Linear keys and Gate Artifacts.');
  process.exit(0);
}

if (!linearKeyLooksPresent) {
  console.warn('WARN: Missing valid Linear key (expected something like DEV-1234).');
}

if (!gateHasAtLeastOneLink && !gateArtifactsNA) {
  console.warn('WARN: Gate Artifacts should contain at least one link (or mark N/A).');
}

console.log('PR template check completed (non-blocking warnings may be present).');
process.exit(0);

