#!/usr/bin/env node

/**
 * Coverage Verification Script
 * 
 * Verifies that test coverage meets Week 9 spec requirement ≥80% (FR-016, SC-005)
 * 
 * Usage:
 *   node scripts/verify-coverage.mjs
 * 
 * Exit codes:
 *   0 - Coverage meets thresholds
 *   1 - Coverage below thresholds
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COVERAGE_THRESHOLD = 80; // Spec requirement: ≥80% (FR-016, SC-005)
const COVERAGE_FILE = path.join(__dirname, "..", "coverage", "coverage-summary.json");

function calculatePercentage(covered, total) {
  if (total === 0) return 100;
  return Math.round((covered / total) * 100 * 100) / 100;
}

function verifyCoverage() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error(`❌ Coverage file not found: ${COVERAGE_FILE}`);
    console.error("   Run 'pnpm test:ci' first to generate coverage report");
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_FILE, "utf-8"));

  const total = coverageData.total;
  const metrics = {
    lines: calculatePercentage(total.lines.covered, total.lines.total),
    statements: calculatePercentage(total.statements.covered, total.statements.total),
    functions: calculatePercentage(total.functions.covered, total.functions.total),
    branches: calculatePercentage(total.branches.covered, total.branches.total),
  };

  console.log("\n📊 Coverage Report");
  console.log("=".repeat(60));
  console.log(`Lines:       ${metrics.lines.toFixed(1)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
  console.log(`Statements:  ${metrics.statements.toFixed(1)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
  console.log(`Functions:   ${metrics.functions.toFixed(1)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
  console.log(`Branches:    ${metrics.branches.toFixed(1)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
  console.log("=".repeat(60));

  const allPassed = Object.values(metrics).every((value) => value >= COVERAGE_THRESHOLD);

  if (allPassed) {
    console.log(`\n✅ All coverage metrics meet ≥${COVERAGE_THRESHOLD}% threshold`);
    console.log("   Spec requirement FR-016, SC-005 satisfied");
  } else {
    console.log(`\n❌ Some coverage metrics are below ${COVERAGE_THRESHOLD}% threshold:`);
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value < COVERAGE_THRESHOLD) {
        console.log(`   - ${metric}: ${value.toFixed(1)}% (needs ${COVERAGE_THRESHOLD}%)`);
      }
    });
    console.log("\n   Please add tests to improve coverage");
  }

  return { passed: allPassed, metrics };
}

// Main execution
try {
  const result = verifyCoverage();
  
  // Write coverage summary for CI
  const summaryFile = path.join(__dirname, "..", "coverage", "coverage-verification.json");
  fs.mkdirSync(path.dirname(summaryFile), { recursive: true });
  fs.writeFileSync(
    summaryFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        threshold: COVERAGE_THRESHOLD,
        metrics: result.metrics,
        passed: result.passed,
        spec: "FR-016, SC-005",
      },
      null,
      2
    ) + "\n"
  );

  process.exit(result.passed ? 0 : 1);
} catch (error) {
  console.error("\n❌ Error verifying coverage:", error.message);
  process.exit(1);
}

