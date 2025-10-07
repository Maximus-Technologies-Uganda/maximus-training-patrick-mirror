#!/usr/bin/env node
"use strict";

// T042: Basic governance report
// Reads root package-lock.json and prints production dependencies and versions.
// Usage: node scripts/generate-governance-report.js [--json]

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

function main() {
  const root = process.cwd();
  const lockPath = path.join(root, "package-lock.json");
  if (!fs.existsSync(lockPath)) {
    console.error("package-lock.json not found at repo root");
    process.exit(1);
  }

  const lock = readJson(lockPath);
  const prod = collectProdDeps(lock);
  const isJson = process.argv.includes("--json");

  if (isJson) {
    console.log(JSON.stringify({ dependencies: prod }, null, 2));
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
}

try {
  main();
} catch (err) {
  console.error("generate-governance-report failed:", err && err.stack ? err.stack : err);
  process.exit(1);
}


