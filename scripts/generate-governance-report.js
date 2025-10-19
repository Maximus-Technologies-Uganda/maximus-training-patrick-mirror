#!/usr/bin/env node
"use strict";

// T042: Basic governance report
// Reads root package-lock.json and prints production dependencies and versions.
// Usage: node scripts/generate-governance-report.js [--json] [--out <path>]

const fs = require("fs");
const path = require("path");

function readJson(absPath) {
  try {
    return JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (err) {
    console.error(`Failed to read ${absPath}:`, err && err.message ? err.message : String(err));
    process.exit(1);
  }
}

function collectProdDeps(lock) {
  // npm v7+ lockfileVersion 2/3:
  // - Workspaces populate dependency metadata primarily under the "packages" map
  //   with keys like "node_modules/<name>" or "<ws>/node_modules/<name>".
  // - Some non-workspace projects still populate the legacy top-level
  //   "dependencies" map. We support both.
  const collectedNameToVersion = {};

  // 1) Legacy-friendly top-level dependencies (non-workspace projects)
  const topLevelDependencies = lock && lock.dependencies ? lock.dependencies : {};
  for (const [dependencyName, dependencyMeta] of Object.entries(topLevelDependencies)) {
    if (!dependencyMeta) continue;
    if (dependencyMeta.dev === true) continue; // skip dev-only
    const version = dependencyMeta.version || dependencyMeta.resolved || "";
    collectedNameToVersion[dependencyName] = { version };
  }

  // 2) Workspace-aware scan of lock.packages
  const packagesMap = lock && lock.packages ? lock.packages : {};
  const packagePaths = Object.keys(packagesMap);
  if (packagePaths.length) {
    for (const packagePath of packagePaths) {
      const packageMeta = packagesMap[packagePath];
      if (!packageMeta) continue;
      if (packageMeta.dev === true) continue; // skip dev-only

      // Only consider installed packages under any node_modules directory.
      // Use the DEEPEST node_modules occurrence so transitive deps are captured
      // e.g. a/b/node_modules/x/node_modules/y -> pick "y" (or "@scope/y").
      const NODE_SEG = "node_modules/";
      const nodeModulesIndex = packagePath.lastIndexOf(NODE_SEG);
      if (nodeModulesIndex === -1) continue;

      const afterNodeModules = packagePath.slice(nodeModulesIndex + NODE_SEG.length);
      if (!afterNodeModules || afterNodeModules === "node_modules") continue;
      if (afterNodeModules.startsWith(".bin/")) continue; // ignore .bin shims

      let packageName = "";
      if (afterNodeModules.startsWith("@")) {
        // Scoped package: @scope/name[/...]
        const segments = afterNodeModules.split("/");
        if (segments.length >= 2) packageName = segments[0] + "/" + segments[1];
        else packageName = packageMeta.name || afterNodeModules;
      } else {
        // Unscoped package: name[/...]
        packageName = afterNodeModules.split("/")[0];
      }
      if (!packageName) continue;

      const version = packageMeta.version || packageMeta.resolved || "";
      if (!collectedNameToVersion[packageName]) {
        collectedNameToVersion[packageName] = { version };
      } else if (
        version && collectedNameToVersion[packageName].version !== version &&
        !String(collectedNameToVersion[packageName].version).split(" | ").includes(version)
      ) {
        // Aggregate multiple versions encountered across workspaces for the same package
        const existing = String(collectedNameToVersion[packageName].version);
        const set = new Set(existing.split(" | ").filter(Boolean));
        set.add(version);
        collectedNameToVersion[packageName].version = Array.from(set).sort().join(" | ");
      }
    }
  }

  return collectedNameToVersion;
}

// Compute optional warnings about dependency version drift across workspaces
// Flags packages that appear with multiple versions and especially different MAJOR versions
function computeVersionDriftWarnings(collectedNameToVersion) {
  /** @type {{ package: string, versions: string[], majors: string[], majorDrift: boolean }[]} */
  const drift = [];

  const toMajors = (versions) => {
    return versions
      .map((v) => String(v).trim())
      .filter(Boolean)
      .map((v) => v.split(".")[0]) // naive major extraction, resilient to non-semver by taking first token
      .map((m) => (m && /\d+/.test(m) ? m.replace(/[^0-9]/g, "") : m))
      .filter(Boolean);
  };

  for (const [name, meta] of Object.entries(collectedNameToVersion || {})) {
    const raw = String(meta && meta.version ? meta.version : "");
    const versions = raw.split(" | ").map((s) => s.trim()).filter(Boolean);
    if (versions.length <= 1) continue;
    const majors = Array.from(new Set(toMajors(versions)));
    const majorDrift = majors.length > 1 && majors.every((m) => /\d+/.test(m));
    drift.push({ package: name, versions, majors, majorDrift });
  }

  return {
    versionDrift: drift,
    summary: {
      packagesWithDrift: drift.length,
      packagesWithMajorDrift: drift.filter((d) => d.majorDrift).length,
    },
  };
}

function parseArgs(argv) {
  /** @type {{ json: boolean, out: string, failOnMajorDrift: boolean }} */
  const cfg = { json: false, out: "", failOnMajorDrift: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") cfg.json = true;
    else if (a === "--out" && i + 1 < argv.length) { cfg.out = String(argv[++i] || ""); }
    else if (a === "--fail-on-major-drift") { cfg.failOnMajorDrift = true; }
  }
  return cfg;
}

function main() {
  const args = parseArgs(process.argv);
  const root = process.cwd();
  const lockPath = path.join(root, "package-lock.json");
  if (!fs.existsSync(lockPath)) {
    console.error("package-lock.json not found at repo root");
    process.exit(1);
  }

  const lock = readJson(lockPath);
  const prod = collectProdDeps(lock);
  const warnings = computeVersionDriftWarnings(prod);
  const isJson = args.json;
  const outPath = args.out;

  if (isJson || outPath) {
    const payload = {
      passed: true,
      approvedExceptions: [],
      dependencies: prod,
      warnings,
      generatedAt: new Date().toISOString(),
    };
    if (args.failOnMajorDrift && warnings && warnings.summary && warnings.summary.packagesWithMajorDrift > 0) {
      payload.passed = false;
      payload.reasons = [
        `Major version drift detected for ${warnings.summary.packagesWithMajorDrift} package(s)`
      ];
    }
    if (outPath) {
      const absOut = path.isAbsolute(outPath) ? outPath : path.join(root, outPath);
      const dir = path.dirname(absOut);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(absOut, JSON.stringify(payload, null, 2) + "\n", "utf8");
      console.log(`[governance] Wrote ${absOut}`);
      if (args.failOnMajorDrift && payload.passed === false) process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(payload, null, 2));
    if (args.failOnMajorDrift && payload.passed === false) process.exitCode = 1;
    return;
  }

  const names = Object.keys(prod).sort((a, b) => a.localeCompare(b));
  console.log("Governance Report: Production Dependencies (from package-lock.json)\n");
  if (names.length === 0) {
    console.log("(none)");
    return;
  }
  console.log("Name,Version");
  for (const name of names) {
    console.log(`${name},${prod[name].version}`);
  }
  if (args.failOnMajorDrift && warnings && warnings.summary && warnings.summary.packagesWithMajorDrift > 0) {
    console.error(`Major version drift detected for ${warnings.summary.packagesWithMajorDrift} package(s)`);
    process.exitCode = 1;
  }
}

try {
  main();
} catch (err) {
  console.error("generate-governance-report failed:", err && err.stack ? err.stack : err);
  process.exit(1);
}


