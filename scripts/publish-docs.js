/*
Builds the frontend with a GitHub Pages base path and copies the output
into the repository-level docs/ folder for "Deploy from a branch".
*/
const { execSync } = require('child_process');
const { mkdirSync, cpSync, existsSync, readdirSync, writeFileSync } = require('fs');
const { resolve, join } = require('path');

const repoRoot = resolve(process.cwd());
const frontendDir = resolve(repoRoot, 'frontend');
const distDir = resolve(frontendDir, 'dist');
const docsDir = resolve(repoRoot, 'docs');

function run(command, cwd, env) {
  execSync(command, { stdio: 'inherit', cwd, env: { ...process.env, ...env } });
}

// Install deps only if needed
if (!existsSync(resolve(frontendDir, 'node_modules'))) {
  run('npm ci', frontendDir);
}

// Build with base path inferred from git remote URL
let repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : null;
if (!repoName) {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { cwd: repoRoot }).toString().trim();
    const match = remoteUrl.match(/[:/](?<name>[^/]+)\.git$/);
    if (match && match.groups) repoName = match.groups.name;
  } catch (_error) {}
}
const appBase = repoName ? `/${repoName}/` : '/';
run('npm run build', frontendDir, { APP_BASE: appBase });

// Ensure docs folder exists
mkdirSync(docsDir, { recursive: true });

// Copy built assets into docs (flatten contents of dist into docs)
for (const name of readdirSync(distDir)) {
  const src = join(distDir, name);
  const dest = join(docsDir, name);
  cpSync(src, dest, { recursive: true, force: true });
}

// Add .nojekyll to ensure underscored files are served
try { writeFileSync(join(docsDir, '.nojekyll'), ''); } catch (_error) {}

console.log('Docs published to', docsDir);


