#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

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
const COVERAGE_FILE = path.join(REPO_ROOT, 'coverage', 'coverage-summary.json');
const TEST_SUMMARY_FILE = path.join(REPO_ROOT, 'test-results', 'summary.json');
const TYPECHECK_FILE = path.join(REPO_ROOT, 'typecheck', 'results.json');
const A11Y_FILE = path.join(REPO_ROOT, 'a11y', 'report.json');
const CONTRACT_FILE = path.join(REPO_ROOT, 'contract', 'report.json');
const SECURITY_FILE = path.join(REPO_ROOT, 'security', 'audit-summary.json');
const GOVERNANCE_FILE = path.join(REPO_ROOT, 'governance', 'report.json');
const GATE_OUT_DIR = path.join(REPO_ROOT, 'gate');
const GATE_SUMMARY = path.join(GATE_OUT_DIR, 'summary.json');

const COVERAGE_THRESHOLDS = {
  statements: 60,
  branches: 50,
  functions: 55,
};

// Per-project coverage thresholds (T029/DEV-703)
const API_COVERAGE_THRESHOLDS = {
  lines: 80,
  branches: 70,
};

const FRONTEND_COVERAGE_THRESHOLDS = {
  lines: 70,
};

const COVERAGE_METRICS = ['lines', 'branches', 'functions', 'statements'];

const PROJECT_COVERAGE_TARGETS = [
  {
    id: 'api',
    displayName: 'API',
    prefixes: ['api', 'api/src', 'apps/api', 'packages/api'],
    thresholds: API_COVERAGE_THRESHOLDS,
  },
  {
    id: 'frontend-next',
    displayName: 'frontend-next',
    prefixes: [
      'frontend-next',
      'frontend-next/src',
      'apps/frontend-next',
      'packages/frontend-next',
    ],
    thresholds: FRONTEND_COVERAGE_THRESHOLDS,
  },
];

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
  'coverage',
  'tests',
  'typecheck',
  'a11y',
  'contract',
  'security',
  'governance',
];

function normalizeAccumulatorShape(subject, label) {
  if (!subject || typeof subject !== 'object') {
    throw new Error(`${label} must be a non-null object`);
  }

  return COVERAGE_METRICS.reduce((acc, metric) => {
    const data = subject[metric];
    const total = Number(data?.total ?? 0);
    const covered = Number(data?.covered ?? 0);

    if (!Number.isFinite(total) || total < 0) {
      throw new Error(`${label}.${metric}.total must be a non-negative number`);
    }

    if (!Number.isFinite(covered) || covered < 0) {
      throw new Error(`${label}.${metric}.covered must be a non-negative number`);
    }

    acc[metric] = { total, covered };
    return acc;
  }, {});
}

function validateCoverageMetricsInput(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    throw new Error('metrics must be a non-null object');
  }

  const providedMetrics = COVERAGE_METRICS.filter((metric) =>
    Object.prototype.hasOwnProperty.call(metrics, metric),
  );

  if (providedMetrics.length === 0) {
    throw new Error(
      'metrics must include at least one coverage metric (lines, branches, functions, statements)',
    );
  }

  for (const metric of providedMetrics) {
    const entry = metrics[metric];
    if (!entry || typeof entry !== 'object') {
      throw new Error(`metrics.${metric} must be an object`);
    }

    const total = Number(entry.total ?? 0);
    const covered = Number(entry.covered ?? 0);

    if (!Number.isFinite(total) || total < 0) {
      throw new Error(`metrics.${metric}.total must be a non-negative number`);
    }

    if (!Number.isFinite(covered) || covered < 0) {
      throw new Error(`metrics.${metric}.covered must be a non-negative number`);
    }
  }
}

function readJsonIfExists(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Accumulate coverage metrics from multiple sources (immutably).
 * Handles istanbul `::` prefix convention for project-scoped metrics.
 */
function accumulateCoverageMetrics(accumulator, metrics) {
  const normalizedAccumulator = normalizeAccumulatorShape(accumulator, 'accumulator');
  validateCoverageMetricsInput(metrics);

  const result = COVERAGE_METRICS.reduce((acc, metric) => {
    acc[metric] = { ...normalizedAccumulator[metric] };
    return acc;
  }, {});

  for (const metric of COVERAGE_METRICS) {
    if (!Object.prototype.hasOwnProperty.call(metrics, metric)) continue;

    const entry = metrics[metric];
    const total = Number(entry.total ?? 0);
    const covered = Number(entry.covered ?? 0);

    result[metric] = {
      total: normalizedAccumulator[metric].total + total,
      covered: normalizedAccumulator[metric].covered + covered,
    };
  }

  return result;
}

/**
 * Compute project-specific coverage from a summary object.
 * Prefixes (e.g., ["api", "frontend-next"]) filter to keys like "api::lines".
 */
function isMetricGroup(metric) {
  if (!metric || typeof metric !== 'object') return false;
  return COVERAGE_METRICS.some((key) => metric[key] && typeof metric[key] === 'object');
}

function extractMetricKey(key) {
  if (!key) return null;
  const metricFromDoubleColon = key.includes('::') ? key.split('::')[1] : null;
  if (metricFromDoubleColon && COVERAGE_METRICS.includes(metricFromDoubleColon)) {
    return metricFromDoubleColon;
  }

  if (COVERAGE_METRICS.includes(key)) {
    return key;
  }

  const normalized = key.replace(/\\/g, '/');
  const lastSegment = normalized.slice(normalized.lastIndexOf('/') + 1);
  if (COVERAGE_METRICS.includes(lastSegment)) {
    return lastSegment;
  }

  return null;
}

function matchesPrefix(key, prefix) {
  if (!prefix) return false;
  const normalizedKey = key.replace(/\\/g, '/');
  const normalizedPrefix = prefix.replace(/\\/g, '/');

  return (
    normalizedKey === normalizedPrefix ||
    normalizedKey.startsWith(`${normalizedPrefix}::`) ||
    normalizedKey.startsWith(`${normalizedPrefix}/`) ||
    normalizedKey.startsWith(`${normalizedPrefix}.`)
  );
}

function computeProjectCoverage(summary, prefixes = []) {
  let accumulated = {
    lines: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    statements: { total: 0, covered: 0 },
  };

  if (!summary || typeof summary !== 'object') {
    return finalizeCoveragePercentages(accumulated);
  }

  const normalizedPrefixes = prefixes.map((prefix) => String(prefix || ''));

  for (const key of Object.keys(summary)) {
    if (key === 'total') continue;

    const metric = summary[key];
    if (!metric || typeof metric !== 'object') continue;

    const shouldConsider =
      normalizedPrefixes.length === 0 ||
      normalizedPrefixes.some((prefix) => matchesPrefix(String(key), prefix));

    if (!shouldConsider) continue;

    if (isMetricGroup(metric)) {
      try {
        accumulated = accumulateCoverageMetrics(accumulated, metric);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to accumulate coverage for ${key}: ${message}`);
      }
      continue;
    }

    const metricKey = extractMetricKey(String(key));
    if (metricKey) {
      try {
        accumulated = accumulateCoverageMetrics(accumulated, { [metricKey]: metric });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to accumulate coverage for ${key}: ${message}`);
      }
    }
  }

  return finalizeCoveragePercentages(accumulated);
}

function hasCoverageTotals(projectCoverage) {
  if (!projectCoverage) return false;
  return COVERAGE_METRICS.some((metric) => Number(projectCoverage[metric]?.total || 0) > 0);
}

function formatPercentage(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.0';
  return num.toFixed(1);
}

/**
 * Finalize coverage percentages from accumulated metrics.
 * Converts totals/covered to percentages with 2 decimal places.
 */
function finalizeCoveragePercentages(accumulator) {
  const result = {};
  for (const metric of ['lines', 'branches', 'functions', 'statements']) {
    const data = accumulator[metric];
    const total = data?.total || 0;
    const covered = data?.covered || 0;
    const pct = total === 0 ? 0 : Number(((covered / total) * 100).toFixed(2));
    result[metric] = { total, covered, pct };
  }
  return result;
}

/**
 * Evaluate Spectral linting results (T080/DEV-705).
 * Enforces 0 errors in OpenAPI specification.
 */
function evaluateSpectral(spectralReport) {
  if (!spectralReport) {
    return { passed: true, reason: 'No Spectral report found (treat as pass)', metrics: null };
  }

  const errors = Array.isArray(spectralReport.result)
    ? spectralReport.result.filter((r) => String(r.severity || '').toLowerCase() === 'error')
    : [];

  const passed = errors.length === 0;
  return {
    passed,
    reason: passed
      ? 'OpenAPI spec validated (0 Spectral errors)'
      : `${errors.length} Spectral error(s) in OpenAPI spec`,
    metrics: { errors: errors.length },
  };
}

function evaluateCoverage(coverageSummary) {
  if (!coverageSummary || !coverageSummary.total) {
    return {
      passed: false,
      reason: `Missing coverage summary (${COVERAGE_FILE})`,
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

  const failureReasons = [];
  if (!checks.statements || !checks.branches || !checks.functions) {
    failureReasons.push(
      `Aggregate coverage below thresholds (stmt ${formatPercentage(statements)}% / br ${formatPercentage(
        branches,
      )}% / fn ${formatPercentage(functions)}%)`,
    );
  }

  const projectMetrics = {};
  for (const project of PROJECT_COVERAGE_TARGETS) {
    let coverage;
    try {
      coverage = computeProjectCoverage(coverageSummary, project.prefixes);
      projectMetrics[project.id] = coverage;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      projectMetrics[project.id] = null;
      failureReasons.push(`${project.displayName} coverage data invalid (${message})`);
      continue;
    }

    if (!hasCoverageTotals(coverage)) {
      failureReasons.push(`${project.displayName} coverage data missing`);
      continue;
    }

    const projectFailures = [];
    for (const [metric, threshold] of Object.entries(project.thresholds)) {
      const actual = Number(coverage[metric]?.pct ?? 0);
      if (!Number.isFinite(actual) || actual < threshold) {
        projectFailures.push(`${metric} ${formatPercentage(actual)}% < ${threshold}%`);
      }
    }

    if (projectFailures.length) {
      failureReasons.push(
        `${project.displayName} coverage below thresholds (${projectFailures.join(', ')})`,
      );
    }
  }

  const passed = failureReasons.length === 0;

  return {
    passed,
    reason: passed ? 'Coverage thresholds met' : failureReasons.join('; '),
    metrics: { statements, branches, functions, lines, projects: projectMetrics },
  };
}

function evaluateTests(testSummary) {
  if (!testSummary) {
    return { passed: true, reason: 'No test summary found (treat as pass)', metrics: null };
  }
  const failed = Number(testSummary.failed || 0);
  const passedCount = Number(testSummary.passed || 0);
  const total = Number(testSummary.total || passedCount + failed);
  return {
    passed: failed === 0,
    reason: failed === 0 ? 'All required tests passed' : `${failed} test suite(s) failed`,
    metrics: { total, passed: passedCount, failed },
  };
}

function evaluateTypecheck(typecheck) {
  if (!typecheck) {
    return { passed: true, reason: 'No type-check results found (treat as pass)', metrics: null };
  }
  const errors = Number(typecheck.errors || 0);
  return {
    passed: errors === 0,
    reason: errors === 0 ? 'Type-check passed' : `${errors} type error(s)`,
    metrics: { errors },
  };
}

function evaluateA11y(report) {
  if (!report) {
    return { passed: true, reason: 'No a11y report found (treat as pass)', metrics: null };
  }
  // Expect structure: { violations: [{ impact: 'critical'|'serious'|... }, ...] }
  const violations = Array.isArray(report.violations) ? report.violations : [];
  const criticalOrSerious = violations.filter((v) => {
    const impact = (v && v.impact ? String(v.impact) : '').toLowerCase();
    return impact === 'critical' || impact === 'serious';
  });
  const passed = criticalOrSerious.length === 0;
  return {
    passed,
    reason: passed
      ? 'No critical/serious a11y violations'
      : `${criticalOrSerious.length} critical/serious a11y violation(s)`,
    metrics: { totalViolations: violations.length, criticalOrSerious: criticalOrSerious.length },
  };
}

function evaluateContract(contract) {
  if (!contract) {
    return { passed: true, reason: 'No contract report found (treat as pass)', metrics: null };
  }
  // Expect structure: { breakingMismatches: number }
  const breaking = Number(contract.breakingMismatches || 0);
  return {
    passed: breaking === 0,
    reason:
      breaking === 0
        ? 'No breaking contract mismatches'
        : `${breaking} breaking contract mismatch(es)`,
    metrics: { breaking },
  };
}

function evaluateSecurity(security) {
  if (!security) {
    return { passed: true, reason: 'No security summary found (treat as pass)', metrics: null };
  }
  // Expect structure: { critical: number, high: number, medium: number, low: number, tool?: string, failed?: boolean }
  const tool = String(security.tool || '').toLowerCase();
  const failedFlag = Boolean(security.failed);
  if (tool === 'fallback' || failedFlag) {
    return {
      passed: false,
      reason: 'Security audit unavailable (fallback or failed)',
      metrics: {
        critical: Number(security.critical || 0),
        high: Number(security.high || 0),
        medium: Number(security.medium || 0),
        low: Number(security.low || 0),
        tool,
        failed: failedFlag,
      },
    };
  }

  const critical = Number(security.critical || 0);
  const high = Number(security.high || 0);
  const passed = critical === 0 && high === 0;
  return {
    passed,
    reason: passed
      ? 'No high/critical vulnerabilities'
      : `Security findings: critical=${critical}, high=${high}`,
    metrics: {
      critical,
      high,
      medium: Number(security.medium || 0),
      low: Number(security.low || 0),
    },
  };
}

function evaluateGovernance(governance) {
  if (!governance) {
    return { passed: true, reason: 'No governance report found (treat as pass)', metrics: null };
  }
  // Expect structure: { passed: boolean, reasons?: string[] }
  const passed = Boolean(governance.passed !== false);
  const reasons = Array.isArray(governance.reasons) ? governance.reasons : [];
  return {
    passed,
    reason: passed ? 'Governance checks passed' : `Governance failed: ${reasons.join('; ')}`,
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
    if (arg === '--require' && i + 1 < argv.length) {
      const list = String(argv[i + 1] || '');
      cfg.required = list
        .split(',')
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
  const list =
    governance && Array.isArray(governance.approvedExceptions) ? governance.approvedExceptions : [];
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
    const waiver = approved.find((ex) => ex.scope === 'missing-artifact');
    if (waiver) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === 'security' && result.passed === false) {
    const lowerReason = String(result.reason || '').toLowerCase();
    const secEx = approved.find((ex) => ex.waiveAllCurrentFindings === true);
    const allowLevels = approved.flatMap((ex) =>
      Array.isArray(ex.allowLevels) ? ex.allowLevels : [],
    );
    const allowFallback = approved.find((ex) => ex.allowFallback === true);
    // Waive high/critical findings
    if (secEx || allowLevels.includes('high') || allowLevels.includes('critical')) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
    // Waive audit fallback/unavailable when explicitly approved
    if (
      allowFallback &&
      (lowerReason.includes('fallback') || lowerReason.includes('unavailable'))
    ) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === 'a11y' && result.passed === false) {
    const allowImpacts = approved.flatMap((ex) =>
      Array.isArray(ex.allowImpacts) ? ex.allowImpacts : [],
    );
    if (allowImpacts.includes('critical') || allowImpacts.includes('serious')) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === 'contract' && result.passed === false) {
    const allowBreaking = approved.find((ex) => ex.allowBreaking === true);
    if (allowBreaking) {
      return { ...result, passed: true, reason: `${result.reason} (waived by exception)` };
    }
  }

  if (dimensionKey === 'coverage' && result.passed === false) {
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
    decision: decision.passed ? 'PASS' : 'FAIL',
    failures: decision.failures,
    thresholds: {
      coverage: COVERAGE_THRESHOLDS,
      coveragePerProject: {
        api: API_COVERAGE_THRESHOLDS,
        'frontend-next': FRONTEND_COVERAGE_THRESHOLDS,
      },
      a11y: 'no critical/serious',
      contract: 'no breaking mismatches',
      security: 'no high/critical',
    },
    requiredDimensions: required,
    results,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(GATE_SUMMARY, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  // Emit Coverage Totals block to stdout for CI summary (Spec label must be exact)
  if (results.coverage && results.coverage.metrics) {
    const c = results.coverage.metrics;
    console.log(
      '\nCoverage Totals\n' +
        `Statements: ${Number(c.statements ?? 0).toFixed(1)}%\n` +
        `Branches: ${Number(c.branches ?? 0).toFixed(1)}%\n` +
        `Functions: ${Number(c.functions ?? 0).toFixed(1)}%\n` +
        `Lines: ${Number(c.lines ?? 0).toFixed(1)}%`,
    );
  }

  // Emit concise single-line gate summary for CI parsers
  try {
    const flatFailures =
      decision.failures && decision.failures.length ? decision.failures.join(', ') : 'none';
    console.log(`Gate Decision: ${decision.passed ? 'PASS' : 'FAIL'}; Failures: ${flatFailures}`);
  } catch {
    /* noop */
  }

  if (!decision.passed) {
    console.error('Quality Gate: FAIL');
    for (const key of decision.failures) {
      console.error(` - ${key}: ${results[key]?.reason || 'failed'}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Quality Gate: PASS');
  }
}

// Module exports for testing and reuse
module.exports = {
  accumulateCoverageMetrics,
  computeProjectCoverage,
  finalizeCoveragePercentages,
  evaluateSpectral,
  evaluateCoverage,
  evaluateTests,
  evaluateTypecheck,
  evaluateA11y,
  evaluateContract,
  evaluateSecurity,
  evaluateGovernance,
  aggregateCoverageResults: (coverage) => evaluateCoverage(coverage),
  evaluateGate: (results) => decideGate(results),
  API_COVERAGE_THRESHOLDS,
  FRONTEND_COVERAGE_THRESHOLDS,
  COVERAGE_THRESHOLDS,
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Quality Gate aggregator failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
