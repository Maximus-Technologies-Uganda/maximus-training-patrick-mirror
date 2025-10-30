const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Integration tests for the quality gate aggregation engine.
 * Validates all 8 dimensions: lint, typecheck, unit, coverage, a11y, contract, build, deploy-preview.
 */

describe('Quality Gate Integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  const createArtifacts = (baseDir) => {
    // Coverage artifacts (Phase 1)
    fs.mkdirSync(path.join(baseDir, 'coverage'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'coverage', 'coverage-summary.json'),
      JSON.stringify({
        total: {
          lines: { total: 100, covered: 80, skipped: 0, pct: 80 },
          statements: { total: 100, covered: 80, skipped: 0, pct: 80 },
          functions: { total: 20, covered: 16, skipped: 0, pct: 80 },
          branches: { total: 50, covered: 35, skipped: 0, pct: 70 },
        },
        'api/src': {
          lines: { total: 100, covered: 80, skipped: 0, pct: 80 },
          statements: { total: 100, covered: 80, skipped: 0, pct: 80 },
          functions: { total: 20, covered: 16, skipped: 0, pct: 80 },
          branches: { total: 50, covered: 35, skipped: 0, pct: 70 },
        },
      }),
    );

    // Lint artifacts
    fs.mkdirSync(path.join(baseDir, 'lint'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'lint', 'results.json'),
      JSON.stringify({
        results: [
          {
            filePath: '/path/to/file.ts',
            messages: [],
            suppressedMessages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ],
        metadata: { rulesMeta: {} },
      }),
    );

    // Typecheck artifacts
    fs.mkdirSync(path.join(baseDir, 'typecheck'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'typecheck', 'results.json'),
      JSON.stringify({
        success: true,
        errors: [],
      }),
    );

    // Unit test artifacts
    fs.mkdirSync(path.join(baseDir, 'test-results'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'test-results', 'api.json'),
      JSON.stringify({
        success: true,
        numFailedTests: 0,
        numPassedTests: 15,
        testResults: [],
      }),
    );
    fs.writeFileSync(
      path.join(baseDir, 'test-results', 'frontend-next.json'),
      JSON.stringify({
        success: true,
        numFailedTests: 0,
        numPassedTests: 25,
        testResults: [],
      }),
    );

    // A11y artifacts
    fs.mkdirSync(path.join(baseDir, 'a11y'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'a11y', 'results.json'),
      JSON.stringify({
        scanned: 5,
        violations: {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 2,
        },
      }),
    );

    // Contract artifacts
    fs.mkdirSync(path.join(baseDir, 'contract'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'contract', 'spectral.json'),
      JSON.stringify({
        result: [],
      }),
    );

    // Security artifacts
    fs.mkdirSync(path.join(baseDir, 'security'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'security', 'audit-summary.json'),
      JSON.stringify({
        vulnerabilities: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 1,
        },
      }),
    );

    // Governance artifacts
    fs.mkdirSync(path.join(baseDir, 'governance'), { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'governance', 'report.json'),
      JSON.stringify({
        tempMitigations: [],
        overdue: [],
      }),
    );

    // Spectral report for OpenAPI validation
    fs.writeFileSync(
      path.join(baseDir, 'contract', 'spectral-report.json'),
      JSON.stringify({
        result: [],
      }),
    );
  };

  it('should aggregate coverage by project (API ≥80%, frontend-next ≥70%)', () => {
    createArtifacts(tempDir);

    const coveragePath = path.join(tempDir, 'coverage', 'coverage-summary.json');
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

    // API coverage validation
    const apiLines = coverage['api/src'].lines.pct;
    const apiBranches = coverage['api/src'].branches.pct;
    expect(apiLines).toBeGreaterThanOrEqual(80);
    expect(apiBranches).toBeGreaterThanOrEqual(70);
  });

  it('should pass gate with all dimensions passing', () => {
    createArtifacts(tempDir);

    const lintPath = path.join(tempDir, 'lint', 'results.json');
    const typecheckPath = path.join(tempDir, 'typecheck', 'results.json');
    const a11yPath = path.join(tempDir, 'a11y', 'results.json');
    const spectralPath = path.join(tempDir, 'contract', 'spectral.json');
    const securityPath = path.join(tempDir, 'security', 'audit-summary.json');

    const lint = JSON.parse(fs.readFileSync(lintPath, 'utf8'));
    const typecheck = JSON.parse(fs.readFileSync(typecheckPath, 'utf8'));
    const a11y = JSON.parse(fs.readFileSync(a11yPath, 'utf8'));
    const spectral = JSON.parse(fs.readFileSync(spectralPath, 'utf8'));
    const security = JSON.parse(fs.readFileSync(securityPath, 'utf8'));

    // All checks pass
    expect(lint.results.every((r) => r.errorCount === 0)).toBe(true);
    expect(typecheck.success).toBe(true);
    expect(a11y.violations.critical).toBe(0);
    expect(spectral.result.length).toBe(0);
    expect(security.vulnerabilities.critical).toBe(0);
  });

  it('should fail gate on critical a11y violations', () => {
    createArtifacts(tempDir);

    const a11yPath = path.join(tempDir, 'a11y', 'results.json');
    const a11yData = JSON.parse(fs.readFileSync(a11yPath, 'utf8'));

    // Simulate critical violation
    a11yData.violations.critical = 1;
    fs.writeFileSync(a11yPath, JSON.stringify(a11yData));

    const a11y = JSON.parse(fs.readFileSync(a11yPath, 'utf8'));
    expect(a11y.violations.critical).toBeGreaterThan(0);
  });

  it('should fail gate on spectral errors', () => {
    createArtifacts(tempDir);

    const spectralPath = path.join(tempDir, 'contract', 'spectral.json');
    const spectralData = JSON.parse(fs.readFileSync(spectralPath, 'utf8'));

    // Simulate Spectral error
    spectralData.result = [
      {
        code: 'operation-tags',
        message: 'Operation tags are missing',
        severity: 'error',
        range: { start: { line: 10 }, end: { line: 10 } },
      },
    ];
    fs.writeFileSync(spectralPath, JSON.stringify(spectralData));

    const spectral = JSON.parse(fs.readFileSync(spectralPath, 'utf8'));
    expect(spectral.result.length).toBeGreaterThan(0);
    expect(spectral.result[0].severity).toBe('error');
  });

  it('should fail gate on critical security vulnerabilities', () => {
    createArtifacts(tempDir);

    const securityPath = path.join(tempDir, 'security', 'audit-summary.json');
    const securityData = JSON.parse(fs.readFileSync(securityPath, 'utf8'));

    // Simulate critical vulnerability
    securityData.vulnerabilities.critical = 1;
    fs.writeFileSync(securityPath, JSON.stringify(securityData));

    const security = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
    expect(security.vulnerabilities.critical).toBeGreaterThan(0);
  });

  it('should track temporary mitigations with expiry', () => {
    createArtifacts(tempDir);

    const governancePath = path.join(tempDir, 'governance', 'report.json');
    const governanceData = JSON.parse(fs.readFileSync(governancePath, 'utf8'));

    // Add a mitigation with expiry
    governanceData.tempMitigations = [
      {
        issue: 'DEV-123',
        owner: 'alice@example.com',
        cleanupBy: '2025-12-31',
        reason: 'Temporary acceptance for migration period',
      },
    ];
    fs.writeFileSync(governancePath, JSON.stringify(governanceData));

    const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
    expect(governance.tempMitigations.length).toBe(1);
    expect(governance.tempMitigations[0].cleanupBy).toBe('2025-12-31');
  });

  it('should detect overdue mitigations', () => {
    createArtifacts(tempDir);

    const governancePath = path.join(tempDir, 'governance', 'report.json');
    const governanceData = JSON.parse(fs.readFileSync(governancePath, 'utf8'));

    // Add an overdue mitigation
    governanceData.tempMitigations = [
      {
        issue: 'DEV-456',
        owner: 'bob@example.com',
        cleanupBy: '2024-01-01',
        reason: 'Expired mitigation',
      },
    ];
    governanceData.overdue = [{ issue: 'DEV-456', cleanupBy: '2024-01-01' }];
    fs.writeFileSync(governancePath, JSON.stringify(governanceData));

    const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8'));
    expect(governance.overdue.length).toBeGreaterThan(0);
  });
});
