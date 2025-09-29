#!/usr/bin/env node
/*
  Aggregates all coverage/coverage-summary.json files across the repo into
  a single coverage/coverage-summary.json at the repository root.

  Requirements handled:
  - Uses glob to discover reports
  - Sums totals for lines, statements, branches, functions
  - Ensures root coverage directory exists
  - Pretty-prints final JSON output
*/

const fs = require("fs");
const path = require("path");
// Attempt to load glob if available. We support both classic glob@7 (callback
// function export) and glob@10+ (named export `glob`). If it's not installed
// in the current environment (e.g., minimal CI step), we fall back to a
// manual directory walk so the script still works.
let globAsync = null;
try {
  const maybeGlobModule = require("glob");
  if (typeof maybeGlobModule === "function") {
    // glob@7 - callback style function export
    const callbackGlob = maybeGlobModule;
    globAsync = (pattern, options) =>
      new Promise((resolve, reject) =>
        callbackGlob(pattern, options, (err, matches) =>
          err ? reject(err) : resolve(matches)
        )
      );
  } else if (maybeGlobModule && typeof maybeGlobModule.glob === "function") {
    // glob@10+ - named export `glob` that returns a Promise
    globAsync = maybeGlobModule.glob;
  }
} catch {
  // Module not found – we'll use the fallback scanner below
}

/**
 * Fallback discovery for coverage summary files when `glob` is unavailable.
 * Walks the repository tree, skipping common build directories.
 * @param {string} rootDir absolute path to repository root
 * @returns {Promise<string[]>} absolute paths to coverage-summary.json files
 */
async function findCoverageSummariesFallback(rootDir) {
  /** @type {string[]} */
  const matches = [];
  const ignored = new Set(["node_modules", "out", "dist", ".next"]);

  /**
   * @param {string} dir
   */
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // ignore unreadable directories
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignored.has(entry.name)) continue;
        // Skip coverage HTML assets folder
        if (
          entry.name === "lcov-report" &&
          entryPath.includes(path.sep + "coverage" + path.sep)
        ) {
          continue;
        }
        walk(entryPath);
      } else if (
        entry.isFile() &&
        entry.name === "coverage-summary.json" &&
        dir.endsWith(path.sep + "coverage")
      ) {
        matches.push(entryPath);
      }
    }
  }

  walk(rootDir);
  return matches;
}

/** @typedef {{ total: number, covered: number, skipped: number, pct?: number }} Metric */

/** @type {Record<string, Metric>} */
const EMPTY_TOTALS = {
  lines: { total: 0, covered: 0, skipped: 0 },
  statements: { total: 0, covered: 0, skipped: 0 },
  branches: { total: 0, covered: 0, skipped: 0 },
  functions: { total: 0, covered: 0, skipped: 0 },
};

/**
 * Adds values from source metric into target metric (mutates target).
 * @param {Metric} target
 * @param {Metric} source
 */
function addMetric(target, source) {
  if (!source) return;
  target.total += Number(source.total || 0);
  target.covered += Number(source.covered || 0);
  target.skipped += Number(source.skipped || 0);
}

/**
 * Recomputes pct based on total and covered.
 * @param {Metric} metric
 */
function computePct(metric) {
  const total = Number(metric.total || 0);
  const covered = Number(metric.covered || 0);
  metric.pct = total > 0 ? +(100 * (covered / total)).toFixed(2) : 100;
}

async function main() {
  // Discover all coverage-summary.json files under any workspace
  // Typical locations: **/coverage/coverage-summary.json
  const repoRoot = process.cwd();
  let matches = [];
  if (globAsync) {
    matches = await globAsync("**/coverage/coverage-summary.json", {
      ignore: [
        "**/node_modules/**",
        "**/out/**",
        "**/dist/**",
        "**/.next/**",
        "**/coverage/**/lcov-report/**",
      ],
      nodir: true,
      absolute: true,
    });
  } else {
    matches = await findCoverageSummariesFallback(repoRoot);
  }

  // Filter out the repository root output target if it exists already
  const targetOut = path.join(repoRoot, "coverage", "coverage-summary.json");
  const inputFiles = matches.filter((p) => path.resolve(p) !== targetOut);

  if (inputFiles.length === 0) {
    console.log("No coverage-summary.json files found. Writing empty totals.");
  } else {
    console.log(`Found ${inputFiles.length} coverage summary file(s).`);
  }

  /** @type {{ total: typeof EMPTY_TOTALS }} */
  const aggregated = { total: JSON.parse(JSON.stringify(EMPTY_TOTALS)) };

  for (const file of inputFiles) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const json = JSON.parse(raw);
      const srcTotals = json && json.total ? json.total : {};

      addMetric(aggregated.total.lines, srcTotals.lines);
      addMetric(aggregated.total.statements, srcTotals.statements);
      addMetric(aggregated.total.branches, srcTotals.branches);
      addMetric(aggregated.total.functions, srcTotals.functions);
    } catch (err) {
      console.warn(`Skipping unreadable or invalid JSON: ${file}`);
      console.warn(err && err.message ? err.message : String(err));
    }
  }

  // Compute pct for each metric after summation
  computePct(aggregated.total.lines);
  computePct(aggregated.total.statements);
  computePct(aggregated.total.branches);
  computePct(aggregated.total.functions);

  // Ensure root coverage directory exists
  const outDir = path.join(repoRoot, "coverage");
  fs.mkdirSync(outDir, { recursive: true });

  // Write pretty-printed JSON
  fs.writeFileSync(targetOut, JSON.stringify(aggregated, null, 2) + "\n", "utf8");

  console.log(`Wrote consolidated coverage summary to: ${targetOut}`);
}

main().catch((err) => {
  console.error("Failed to normalize coverage:", err);
  process.exitCode = 1;
});


