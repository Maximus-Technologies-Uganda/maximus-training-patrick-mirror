#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Quality Gate Aggregator (T030)
 *
 * Inputs (expected if present):
 *  - coverage summary: <repo>/coverage/coverage-summary.json (from scripts/normalize-coverage.js)
 *  - unit/integration test summary: <repo>/test-results/summary.json (optional, best-effort)
 *  - type-check results: <repo>/typecheck/results.json (optional)
 *  - accessibility report: <repo>/a11y/report.json (optional)
 *  - contract validation report: <repo>/contract/report.json (optional)
 *  - security audit summary: <repo>/security/audit-summary.json (optional)
 *  - governance report: <repo>/governance/report.json (optional)
 *
 * Outputs:
 *  - <repo>/gate/summary.json — consolidated metrics and PASS/FAIL decision
 *  - exit code 0 on PASS, 1 on FAIL
 *
 * Thresholds (from spec):
 *  - Coverage baseline (frontend-next included in aggregate):
 *    statements ≥ 60, branches ≥ 50, functions ≥ 55 (percent)
 *  - Any a11y critical/serious violation => FAIL
 *  - Any contract breaking mismatch => FAIL
 *  - Security: high/critical > 0 => FAIL (unless reported as exception in governance report; not implemented here)
 */

const REPO_ROOT = process.cwd();
const COVERAGE_FILE = path.join(REPO_ROOT, "coverage", "coverage-summary.json");
const TEST_SUMMARY_FILE = path.join(REPO_ROOT, "test-results", "summary.json");
const TYPECHECK_FILE = path.join(REPO_ROOT, "typecheck", "results.json");
const A11Y_FILE = path.join(REPO_ROOT, "a11y", "report.json");
const CONTRACT_FILE = path.join(REPO_ROOT, "contract", "report.json");
const SECURITY_FILE = path.join(REPO_ROOT, "security", "audit-summary.json");
const GOVERNANCE_FILE = path.join(REPO_ROOT, "governance", "report.json");
const GATE_OUT_DIR = path.join(REPO_ROOT, "gate");
const GATE_SUMMARY = path.join(GATE_OUT_DIR, "summary.json");

const COVERAGE_THRESHOLDS = {
  statements: 60,
  branches: 50,
  functions: 55,
};

const DIM_TO_PATH = {
  coverage: COVERAGE_FILE,
  tests: TEST_SUMMARY_FILE,
  typecheck: TYPECHECK_FILE,
  a11y: A11Y_FILE,
  contract: CONTRACT_FILE,
  security: SECURITY_FILE,
  governance: GOVERNANCE_FILE,
};

const DEFAULT_REQUIRED_DIMENSIONS = [
  "coverage",
  "tests",
  "typecheck",
  "a11y",
  "contract",
  "security",
  "governance",
];

function readJsonIfExists(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function evaluateCoverage(coverageSummary) {
  if (!coverageSummary || !coverageSummary.total) {
    return {
      passed: false,
      reason: "Missing coverage summary",
      metrics: null,
    };
  }
  const totals = coverageSummary.total;
  const statements = Number(totals.statements?.pct ?? 0);
  const branches = Number(totals.branches?.pct ?? 0);
  const functions = Number(totals.functions?.pct ?? 0);
  const lines = Number(totals.lines?.pct ?? 0);

  const checks = {
    statements: statements >= COVERAGE_THRESHOLDS.statements,
    branches: branches >= COVERAGE_THRESHOLDS.branches,
    functions: functions >= COVERAGE_THRESHOLDS.functions,
  };

  const passed = checks.statements && checks.branches && checks.functions;

  return {
    passed,
    reason: passed
      ? "Coverage thresholds met"
      : `Coverage below thresholds (stmt ${statements}% / br ${branches}% / fn ${functions}%)`,
    metrics: { statements, branches, functions, lines },
  };
}

function evaluateTests(testSummary) {
  if (!testSummary) {
    return { passed: true, reason: "No test summary found (treat as pass)", metrics: null };
  }
  const failed = Number(testSummary.failed || 0);
  const passedCount = Number(testSummary.passed || 0);
  const total = Number(testSummary.total || passedCount + failed);
  return {
    passed: failed === 0,
    reason: failed === 0 ? "All required tests passed" : `${failed} test suite(s) failed`,
    metrics: { total, passed: passedCount, failed },
  };
}

function evaluateTypecheck(typecheck) {
  if (!typecheck) {
    return { passed: true, reason: "No type-check results found (treat as pass)", metrics: null };
  }
  const errors = Number(typecheck.errors || 0);
  return {
    passed: errors === 0,
    reason: errors === 0 ? "Type-check passed" : `${errors} type error(s)` ,
    metrics: { errors },
  };
}

function evaluateA11y(report) {
  if (!report) {
    return { passed: true, reason: "No a11y report found (treat as pass)", metrics: null };
  }
  // Expect structure: { violations: [{ impact: 'critical'|'serious'|... }, ...] }
  const violations = Array.isArray(report.violations) ? report.violations : [];
  const criticalOrSerious = violations.filter((v) => {
    const impact = (v && v.impact ? String(v.impact) : "").toLowerCase();
    return impact === "critical" || impact === "serious";
  });
  const passed = criticalOrSerious.length === 0;
  return {
    passed,
    reason: passed ? "No critical/serious a11y violations" : `${criticalOrSerious.length} critical/serious a11y violation(s)` ,
    metrics: { totalViolations: violations.length, criticalOrSerious: criticalOrSerious.length },
  };
}

function evaluateContract(contract) {
  if (!contract) {
    return { passed: true, reason: "No contract report found (treat as pass)", metrics: null };
  }
  // Expect structure: { breakingMismatches: number }
  const breaking = Number(contract.breakingMismatches || 0);
  return {
    passed: breaking === 0,
    reason: breaking === 0 ? "No breaking contract mismatches" : `${breaking} breaking contract mismatch(es)`,
    metrics: { breaking },
  };
}

function evaluateSecurity(security) {
  if (!security) {
    return { passed: true, reason: "No security summary found (treat as pass)", metrics: null };
  }
  // Expect structure: { critical: number, high: number, medium: number, low: number }
  const critical = Number(security.critical || 0);
  const high = Number(security.high || 0);
  const passed = critical === 0 && high === 0;
  return {
    passed,
    reason: passed ? "No high/critical vulnerabilities" : `Security findings: critical=${critical}, high=${high}`,
    metrics: { critical, high, medium: Number(security.medium || 0), low: Number(security.low || 0) },
  };
}

function evaluateGovernance(governance) {
  if (!governance) {
    return { passed: true, reason: "No governance report found (treat as pass)", metrics: null };
  }
  // Expect structure: { passed: boolean, reasons?: string[] }
  const passed = Boolean(governance.passed !== false);
  const reasons = Array.isArray(governance.reasons) ? governance.reasons : [];
  return {
    passed,
    reason: passed ? "Governance checks passed" : `Governance failed: ${reasons.join("; ")}`,
    metrics: { reasons },
  };
}

function decideGate(dimensions) {
  const keys = Object.keys(dimensions);
  const failures = keys.filter((k) => dimensions[k] && dimensions[k].passed === false);
  const passed = failures.length === 0;
  return { passed, failures };
}

function parseArgs(argv) {
  /** @type {{ required: string[] }} */
  const cfg = { required: DEFAULT_REQUIRED_DIMENSIONS.slice() };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--require" && i + 1 < argv.length) {
      const list = String(argv[i + 1] || "");
      cfg.required = list
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i++;
    }
  }
  return cfg;
}

function isActiveException(ex) {
  if (!ex) return false;
  if (ex.expiresAt) {
    const now = Date.now();
    const exp = Date.parse(ex.expiresAt);
    if (!Number.isNaN(exp) && exp < now) return false;
  }
  return ex.approved === true;
}

function findApprovedExceptions(governance, dimension) {
  const list = governance && Array.isArray(governance.approvedExceptions)
    ? governance.approvedExceptions
    : [];
  return list.filter((ex) => String(ex.dimension) === dimension && isActiveException(ex));
}

function applyExceptions(dimensionKey, result, governance) {
  const approved = findApprovedExceptions(governance, dimensionKey);
  if (!approved.length) return result;

  // Recognized scopes/fields:
  // - scope: 'missing-artifact'
  // - for security: allowLevels: ["high","critical"] or waiveAllCurrentFindings: true
  // - for a11y: allowImpacts: ["critical","serious"]
  // - for contract: allowBreaking: true
  // - for coverage: allowCoverageBelowThreshold: true
  // Generic: waiveAll: true

  const genericWaive = approved.find((ex) => ex.waiveAll === true);
  if (genericWaive && isActiveException(genericWaive)) {
    return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
  }

  if (result.reason && /Missing required artifact/.test(result.reason)) {
    const waiver = approved.find((ex) => ex.scope === "missing-artifact");
    if (waiver) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === "security" && result.passed === false) {
    const secEx = approved.find((ex) => ex.waiveAllCurrentFindings === true);
    const allowLevels = approved.flatMap((ex) => Array.isArray(ex.allowLevels) ? ex.allowLevels : []);
    if (secEx || allowLevels.includes("high") || allowLevels.includes("critical")) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === "a11y" && result.passed === false) {
    const allowImpacts = approved.flatMap((ex) => Array.isArray(ex.allowImpacts) ? ex.allowImpacts : []);
    if (allowImpacts.includes("critical") || allowImpacts.includes("serious")) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === "contract" && result.passed === false) {
    const allowBreaking = approved.find((ex) => ex.allowBreaking === true);
    if (allowBreaking) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === "coverage" && result.passed === false) {
    const allowCoverage = approved.find((ex) => ex.allowCoverageBelowThreshold === true);
    if (allowCoverage) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  return result;
}

function main() {
  const { required } = parseArgs(process.argv);
  const coverage = readJsonIfExists(COVERAGE_FILE);
  const tests = readJsonIfExists(TEST_SUMMARY_FILE);
  const typecheck = readJsonIfExists(TYPECHECK_FILE);
  const a11y = readJsonIfExists(A11Y_FILE);
  const contract = readJsonIfExists(CONTRACT_FILE);
  const security = readJsonIfExists(SECURITY_FILE);
  const governance = readJsonIfExists(GOVERNANCE_FILE);

  /** @type {Record<string, { passed: boolean, reason: string, metrics: any }>} */
  const results = {
    coverage: evaluateCoverage(coverage),
    tests: evaluateTests(tests),
    typecheck: evaluateTypecheck(typecheck),
    a11y: evaluateA11y(a11y),
    contract: evaluateContract(contract),
    security: evaluateSecurity(security),
    governance: evaluateGovernance(governance),
  };

  // Enforce missing-artifact failure for required dimensions (except coverage already handled)
  const artifacts = { coverage, tests, typecheck, a11y, contract, security, governance };
  for (const dim of required) {
    const art = artifacts[dim];
    if (art == null) {
      results[dim] = {
        passed: false,
        reason: `Missing required artifact: ${DIM_TO_PATH[dim] || dim}`,
        metrics: null,
      };
    }
  }

  // Apply approved exceptions from governance report
  for (const dim of Object.keys(results)) {
    results[dim] = applyExceptions(dim, results[dim], governance);
  }

  const decision = decideGate(results);

  ensureDir(GATE_OUT_DIR);
  const summary = {
    decision: decision.passed ? "PASS" : "FAIL",
    failures: decision.failures,
    thresholds: { coverage: COVERAGE_THRESHOLDS, a11y: "no critical/serious", contract: "no breaking mismatches", security: "no high/critical" },
    requiredDimensions: required,
    results,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(GATE_SUMMARY, JSON.stringify(summary, null, 2) + "\n", "utf8");

  if (!decision.passed) {
    console.error("Quality Gate: FAIL");
    for (const key of decision.failures) {
      console.error(` - ${key}: ${results[key]?.reason || "failed"}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Quality Gate: PASS");
  }
}

try {
  main();
} catch (err) {
  console.error("Quality Gate aggregator failed:", err && err.stack ? err.stack : err);
  process.exit(1);
}


