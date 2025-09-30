#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

/**
 * Build Review Packet (T031)
 *
 * Source references:
 *  - Tasks: C:/Users/LENOVO/Training/specs/005-week-6-finishers/tasks.md (T031)
 *  - Spec:  C:/Users/LENOVO/Training/specs/005-week-6-finishers/spec.md (FR-004)
 *  - Plan:  C:/Users/LENOVO/Training/specs/005-week-6-finishers/plan.md (Gate reporting & artifacts)
 *  - Contract (source of truth): C:/Users/LENOVO/Training/api/openapi.json
 *
 * Responsibilities:
 *  - Collect Quality Gate artifacts (coverage, tests, typecheck, a11y, contract, security, governance, gate summary)
 *  - Generate docs/ReviewPacket/manifest.json from manifest.json.template with thresholds and references
 *  - Package docs/ReviewPacket/* into docs/review-packet.zip
 *
 * Usage:
 *  node scripts/quality-gate/build-review-packet.js [--demo-url <url>] [--contract <absOrRelPath>] [--force]
 */

const REPO_ROOT = process.cwd();
const SCRIPTS_DIR = __dirname;
const REVIEW_DIR = path.join(REPO_ROOT, "docs", "ReviewPacket");
const ZIP_PATH = path.join(REPO_ROOT, "docs", "review-packet.zip");
const TEMPLATE_PATH = path.join(SCRIPTS_DIR, "manifest.json.template");

const PATHS = {
  coverage: path.join(REPO_ROOT, "coverage", "coverage-summary.json"),
  tests: path.join(REPO_ROOT, "test-results", "summary.json"),
  typecheck: path.join(REPO_ROOT, "typecheck", "results.json"),
  a11y: path.join(REPO_ROOT, "a11y", "report.json"),
  contract: path.join(REPO_ROOT, "contract", "report.json"),
  security: path.join(REPO_ROOT, "security", "audit-summary.json"),
  governance: path.join(REPO_ROOT, "governance", "report.json"),
  gateSummary: path.join(REPO_ROOT, "gate", "summary.json"),
};

function parseArgs(argv) {
  const args = { demoUrl: process.env.DEMO_URL || "", contract: "", force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--demo-url" && i + 1 < argv.length) {
      args.demoUrl = String(argv[++i] || "").trim();
    } else if (a === "--contract" && i + 1 < argv.length) {
      args.contract = String(argv[++i] || "").trim();
    } else if (a === "--force") {
      args.force = true;
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonIfExists(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function copyFileIfExists(absSourcePath, reviewRelativePath, copiedList) {
  try {
    if (!fs.existsSync(absSourcePath)) return false;
    const destAbs = path.join(REVIEW_DIR, reviewRelativePath);
    ensureDir(path.dirname(destAbs));
    fs.copyFileSync(absSourcePath, destAbs);
    copiedList.push({ source: absSourcePath, dest: destAbs });
    return true;
  } catch (err) {
    console.warn(`WARN: Failed to copy ${absSourcePath}: ${err && err.message ? err.message : String(err)}`);
    return false;
  }
}

function resolveContractPath(userProvided) {
  const defaultContract = path.join(REPO_ROOT, "api", "openapi.json");
  if (userProvided) {
    const abs = path.isAbsolute(userProvided) ? userProvided : path.join(REPO_ROOT, userProvided);
    if (fs.existsSync(abs)) return abs;
  }
  if (fs.existsSync(defaultContract)) return defaultContract;
  // No portable fallback available; return empty to indicate unknown
  return "";
}

function buildManifest(templateObj, args, includedFiles) {
  const specPath = path.join(REPO_ROOT, "specs", "005-week-6-finishers", "spec.md");
  const planPath = path.join(REPO_ROOT, "specs", "005-week-6-finishers", "plan.md");
  const tasksPath = path.join(REPO_ROOT, "specs", "005-week-6-finishers", "tasks.md");

  const resolvedInputs = {
    coverage: fs.existsSync(PATHS.coverage) ? "coverage/coverage-summary.json" : null,
    tests: fs.existsSync(PATHS.tests) ? "test-results/summary.json" : null,
    typecheck: fs.existsSync(PATHS.typecheck) ? "typecheck/results.json" : null,
    a11y: fs.existsSync(PATHS.a11y) ? "a11y/report.json" : null,
    contract: fs.existsSync(PATHS.contract) ? "contract/report.json" : null,
    security: fs.existsSync(PATHS.security) ? "security/audit-summary.json" : null,
    governance: fs.existsSync(PATHS.governance) ? "governance/report.json" : null,
  };

  const manifest = {
    $schema: templateObj && templateObj.$schema ? templateObj.$schema : undefined,
    inputs: resolvedInputs,
    required: Array.isArray(templateObj?.required) ? templateObj.required : [
      "coverage",
      "tests",
      "typecheck",
      "a11y",
      "contract",
      "security",
      "governance",
    ],
    thresholds: templateObj && templateObj.thresholds ? templateObj.thresholds : {
      coverage: { statements: 60, branches: 50, functions: 55 },
      a11y: { denyImpacts: ["critical", "serious"] },
      contract: { allowBreaking: false },
      security: { denyLevels: ["high", "critical"] },
    },
    references: {
      demoUrl: args.demoUrl || "",
      contractSourceOfTruth: resolveContractPath(args.contract),
      spec: specPath,
      plan: planPath,
      tasks: tasksPath,
    },
    packet: {
      baseDir: REVIEW_DIR,
      zipPath: ZIP_PATH,
      included: includedFiles.map((f) => ({ source: f.source, dest: f.dest })),
    },
    generatedAt: new Date().toISOString(),
  };

  return manifest;
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function removeIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
  } catch {/* no-op */}
}

function zipWithArchiverOrCli() {
  try {
    const archiver = require("archiver");
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(ZIP_PATH);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));
      archive.pipe(output);
      archive.directory(REVIEW_DIR, false);
      archive.finalize();
    });
  } catch {
    // Fallback to OS tooling
    const isWindows = process.platform === "win32";
    return new Promise((resolve, reject) => {
      if (isWindows) {
        const cmd = `Compress-Archive -Path \"${REVIEW_DIR}\\*\" -DestinationPath \"${ZIP_PATH}\" -Force`;
        const ps = childProcess.spawn("powershell.exe", ["-NoProfile", "-Command", cmd], { stdio: "inherit" });
        ps.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Compress-Archive exit ${code}`))));
      } else {
        const cwd = path.dirname(REVIEW_DIR);
        const dirName = path.basename(REVIEW_DIR);
        const zip = childProcess.spawn("zip", ["-r", "-q", ZIP_PATH, dirName], { cwd });
        zip.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`zip exit ${code}`))));
      }
    });
  }
}

function main() {
  const args = parseArgs(process.argv);

  ensureDir(REVIEW_DIR);
  if (args.force) removeIfExists(ZIP_PATH);

  const copied = [];

  copyFileIfExists(PATHS.gateSummary, path.join("gate", "summary.json"), copied);
  copyFileIfExists(PATHS.coverage, path.join("coverage", "coverage-summary.json"), copied);
  copyFileIfExists(PATHS.tests, path.join("test-results", "summary.json"), copied);
  copyFileIfExists(PATHS.typecheck, path.join("typecheck", "results.json"), copied);
  copyFileIfExists(PATHS.a11y, path.join("a11y", "report.json"), copied);
  copyFileIfExists(PATHS.contract, path.join("contract", "report.json"), copied);
  copyFileIfExists(PATHS.security, path.join("security", "audit-summary.json"), copied);
  copyFileIfExists(PATHS.governance, path.join("governance", "report.json"), copied);

  const template = readJsonIfExists(TEMPLATE_PATH) || {};
  const manifest = buildManifest(template, args, copied);
  const manifestOut = path.join(REVIEW_DIR, "manifest.json");
  writeJson(manifestOut, manifest);

  // Enforce required artifact presence: fail fast in CI when required are missing
  /** @type {string[]} */
  const requiredDims = Array.isArray(template.required) && template.required.length
    ? template.required
    : ["coverage", "tests", "typecheck", "a11y", "contract", "security", "governance"];
  const missing = requiredDims.filter((dim) => !manifest.inputs || !manifest.inputs[dim]);
  if (missing.length > 0) {
    // Augment manifest with missing list for debuggability without changing schema requirements
    try {
      const augmented = { ...manifest, missingRequired: missing };
      writeJson(manifestOut, augmented);
    } catch { /* ignore */ }
    console.error("Review Packet build failed: missing required artifacts:");
    for (const dim of missing) console.error(` - ${dim}`);
    process.exit(1);
    return;
  }

  zipWithArchiverOrCli()
    .then(() => {
      console.log(`Review Packet built at: ${REVIEW_DIR}`);
      console.log(`Zipped to: ${ZIP_PATH}`);
    })
    .catch((err) => {
      console.error("Failed to create zip:", err && err.message ? err.message : err);
      process.exitCode = 1;
    });
}

try {
  main();
} catch (err) {
  console.error("build-review-packet failed:", err && err.stack ? err.stack : err);
  process.exit(1);
}


