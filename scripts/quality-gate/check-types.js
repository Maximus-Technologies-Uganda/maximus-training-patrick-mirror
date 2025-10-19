#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

/**
 * TypeScript Type-Check Runner (T004)
 *
 * Goals (from specs/007-spec/week-7.5-finishers/spec.md and plan.md):
 * - Run the TypeScript compiler across the monorepo (api, frontend-next)
 * - Produce a JSON summary at <repo>/typecheck/results.json conforming to
 *   scripts/quality-gate/schemas/typecheck.schema.json
 * - Do not fail the process by default; the Quality Gate aggregator will
 *   enforce pass/fail using this artifact (aligns with tasks.md T004)
 *
 * Flags:
 *  --bail       Exit with non-zero code if any type errors are found
 */

const REPO_ROOT = process.cwd();
const OUT_DIR = path.join(REPO_ROOT, "typecheck");
const OUT_FILE = path.join(OUT_DIR, "results.json");

/** @type {{ name: string, dir: string, tsconfig: string }[]} */
const PROJECTS = [
  {
    name: "frontend-next",
    dir: path.join(REPO_ROOT, "frontend-next"),
    tsconfig: path.join(REPO_ROOT, "frontend-next", "tsconfig.json"),
  },
  {
    name: "api",
    dir: path.join(REPO_ROOT, "api"),
    tsconfig: path.join(REPO_ROOT, "api", "tsconfig.json"),
  },
];

function parseArgs(argv) {
  /** @type {{ bail: boolean, projects?: string[] }} */
  const cfg = { bail: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--bail") cfg.bail = true;
    if (arg.startsWith("--projects=")) {
      const value = arg.slice("--projects=".length).trim();
      if (value) cfg.projects = value.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return cfg;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Spawns a process and resolves with its result.
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string }} options
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || REPO_ROOT,
      shell: process.platform === "win32", // improve .cmd and PATH resolution on Windows
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    child.stdout.on("data", (d) => stdoutChunks.push(Buffer.from(d)));
    child.stderr.on("data", (d) => stderrChunks.push(Buffer.from(d)));
    child.on("close", (code) => {
      resolve({
        code: typeof code === "number" ? code : 0,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
}

/**
 * Attempts to run the local workspace tsc binary; falls back to npx typescript.
 * @param {string} projectDir absolute path to the workspace directory
 * @param {string} tsconfigPath absolute path to tsconfig.json
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string, command: string }>}    
 */
async function runTsc(projectDir, tsconfigPath) {
  // Prefer invoking tsc.js via Node to avoid Windows spawn issues
  const nodeExec = process.execPath || (process.platform === "win32" ? "node.exe" : "node");
  const localTscJs = path.join(projectDir, "node_modules", "typescript", "lib", "tsc.js");
  if (fileExists(localTscJs)) {
    const res = await run(nodeExec, [localTscJs, "-p", tsconfigPath, "--noEmit"], { cwd: projectDir });
    return { exitCode: res.code, stdout: res.stdout, stderr: res.stderr, command: `${nodeExec} ${localTscJs} -p ${tsconfigPath} --noEmit` };
  }

  // Next, try the workspace .bin tsc
  const tscName = process.platform === "win32" ? "tsc.cmd" : "tsc";
  const localTsc = path.join(projectDir, "node_modules", ".bin", tscName);
  if (fileExists(localTsc)) {
    const res = await run(localTsc, ["-p", tsconfigPath, "--noEmit"], { cwd: projectDir });
    return { exitCode: res.code, stdout: res.stdout, stderr: res.stderr, command: `${localTsc} -p ${tsconfigPath} --noEmit` };
  }

  // Fallback: use npx to fetch typescript transiently (shell-enabled for Windows resolution)
  const npxCmd = process.platform === "win32" ? "npx" : "npx";
  const res = await run(npxCmd, ["-y", "-p", "typescript", "tsc", "-p", tsconfigPath, "--noEmit"], { cwd: projectDir });
  return { exitCode: res.code, stdout: res.stdout, stderr: res.stderr, command: `${npxCmd} -y -p typescript tsc -p ${tsconfigPath} --noEmit` };
}

/**
 * Extracts an error count from tsc output.
 * Prefers the summary line, falls back to counting "error TS" occurrences.
 * @param {string} stdout
 * @param {string} stderr
 */
function parseTscErrorCount(stdout, stderr) {
  const combined = `${stdout}\n${stderr}`;
  const summaryMatch = combined.match(/Found\s+(\d+)\s+error/);
  if (summaryMatch && summaryMatch[1]) {
    return Number(summaryMatch[1]);
  }
  const matches = combined.match(/\berror\s+TS\d+:/g) || [];
  return matches.length;
}

async function main() {
  const args = parseArgs(process.argv);
  const { bail } = args;

  /** @type {Array<{ name: string, skipped: boolean, errors: number, warnings: number, durationMs: number, exitCode: number, command: string }>} */
  const projectResults = [];

  /** @type {typeof PROJECTS} */
  const selected = (function selectProjects() {
    if (!args.projects || args.projects.length === 0) return PROJECTS;
    const wanted = new Set(args.projects);
    return PROJECTS.filter((p) => wanted.has(p.name));
  })();

  for (const proj of selected) {
    if (!fileExists(proj.tsconfig)) {
      projectResults.push({
        name: proj.name,
        skipped: true,
        errors: 0,
        warnings: 0,
        durationMs: 0,
        exitCode: 0,
        command: "skipped (no tsconfig.json)",
      });
      continue;
    }

    const started = Date.now();
    const result = await runTsc(proj.dir, proj.tsconfig);
    const durationMs = Date.now() - started;
    const errors = parseTscErrorCount(result.stdout, result.stderr);

    projectResults.push({
      name: proj.name,
      skipped: false,
      errors,
      warnings: 0,
      durationMs,
      exitCode: result.exitCode,
      command: result.command,
    });
  }

  const totalErrors = projectResults.reduce((sum, p) => sum + (p.errors || 0), 0);
  const totalWarnings = projectResults.reduce((sum, p) => sum + (p.warnings || 0), 0);

  ensureDir(OUT_DIR);

  // Conform to scripts/quality-gate/schemas/typecheck.schema.json
  const payload = {
    errors: totalErrors,
    warnings: totalWarnings,
    projects: projectResults,
    generatedAt: new Date().toISOString(),
    specRefs: {
      tasks: path.join(REPO_ROOT, "specs", "007-spec", "week-7.5-finishers", "tasks.md"),
      plan: path.join(REPO_ROOT, "specs", "007-spec", "week-7.5-finishers", "plan.md"),
      spec: path.join(REPO_ROOT, "specs", "007-spec", "week-7.5-finishers", "spec.md"),
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");

  if (totalErrors > 0) {
    console.error(`[typecheck] Found ${totalErrors} error(s) across projects.`);
  } else {
    console.log("[typecheck] No type errors found.");
  }

  if (bail && totalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Type-check script failed:", err && err.stack ? err.stack : err);
  try {
    ensureDir(OUT_DIR);
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify({ errors: 1, warnings: 0, failed: true, message: String(err) }, null, 2) + "\n",
      "utf8"
    );
  } catch {}
  process.exit(1);
});


