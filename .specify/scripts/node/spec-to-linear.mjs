#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const { LINEAR_API_KEY, GITHUB_SHA, GITHUB_REPOSITORY, LINEAR_TEAM_ID, LINEAR_TEAM_KEY } = process.env;
if (!LINEAR_API_KEY) {
  console.log('LINEAR_API_KEY not set; skipping.');
  process.exit(0);
}

const run = (cmd) => new Promise((resolve, reject) => {
  const { exec } = require('node:child_process');
  exec(cmd, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) return reject(err);
    resolve({ stdout: String(stdout).trim(), stderr: String(stderr).trim() });
  });
});

const fetchJson = async (url, init = {}) => {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINEAR_API_KEY}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
};

function loadTitleAndSummary(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const title = (lines.find(l => l.startsWith('# ')) || '# Spec').replace(/^#\s+/, '').trim();
  const summaryIndex = lines.findIndex(l => l.startsWith('## Summary'));
  let summary = '';
  if (summaryIndex >= 0) {
    summary = lines.slice(summaryIndex, Math.min(summaryIndex + 30, lines.length)).join('\n');
  } else {
    summary = lines.slice(0, 40).join('\n');
  }
  return { title, summary };
}

async function getChangedSpecFiles() {
  // Use git diff for the current push/merge context; fallback to scanning
  try {
    const base = process.env.GITHUB_BASE_REF || 'HEAD~1';
    // Changed files in the last commit range (best-effort in push context)
    const { stdout } = await run(`git diff --name-only ${base} HEAD`);
    const changed = stdout.split(/\r?\n/).filter(Boolean);
    return changed.filter(f => /^(specs\/).*\/(spec\.md|plan\.md)$/.test(f));
  } catch {
    // Fallback: scan spec directories
    const baseDir = path.join(process.cwd(), 'specs', 'spec');
    if (!fs.existsSync(baseDir)) return [];
    const results = [];
    for (const feature of fs.readdirSync(baseDir)) {
      const specPath = path.join(baseDir, feature, 'spec.md');
      const planPath = path.join(baseDir, feature, 'plan.md');
      if (fs.existsSync(specPath)) results.push(path.relative(process.cwd(), specPath));
      if (fs.existsSync(planPath)) results.push(path.relative(process.cwd(), planPath));
    }
    return results;
  }
}

async function resolveTeam(q) {
  if (LINEAR_TEAM_ID) return { id: LINEAR_TEAM_ID };
  if (LINEAR_TEAM_KEY) {
    const teams = await q(`query($key: String!) { team(key: $key) { id key name } }`, { key: LINEAR_TEAM_KEY });
    if (teams?.data?.team?.id) return { id: teams.data.team.id };
  }
  const teams = await q(`query { teams(first: 1) { nodes { id key name } } }`);
  const team = teams?.data?.teams?.nodes?.[0];
  if (!team) throw new Error('No Linear teams accessible for API key');
  return { id: team.id };
}

async function ensureLinearIssue({ title, description }) {
  const q = async (query, variables) => fetchJson('https://api.linear.app/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });

  const team = await resolveTeam(q);

  // Idempotency: search by title prefix and repository ref in description
  const search = await q(
    `query($q: String!) { issueSearch(query: $q, first: 1) { nodes { id identifier url title } } }`,
    { q: title }
  );
  if (search?.data?.issueSearch?.nodes?.length) {
    console.log(`Linear issue exists for '${title}': ${search.data.issueSearch.nodes[0].url}`);
    return;
  }

  const create = await q(
    `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id url identifier } } }`,
    { input: { teamId: team.id, title, description } }
  );
  if (!create?.data?.issueCreate?.success) {
    throw new Error('Failed to create Linear issue');
  }
  const issue = create.data.issueCreate.issue;
  console.log(`Linear issue created: ${issue.identifier} → ${issue.url}`);
}

async function main() {
  const files = await getChangedSpecFiles();
  if (files.length === 0) {
    console.log('No changed spec/plan files in this push; skipping.');
    return;
  }
  for (const file of files) {
    const abs = path.join(process.cwd(), file);
    const { title, summary } = loadTitleAndSummary(abs);
    const description = `Source: ${file}\nRepo: ${GITHUB_REPOSITORY || ''}\nSHA: ${GITHUB_SHA || ''}\n\n${summary}`;
    try {
      await ensureLinearIssue({ title, description });
    } catch (err) {
      console.error(`Failed to sync ${file}:`, err?.message || err);
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
