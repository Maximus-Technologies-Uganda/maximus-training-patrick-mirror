const {
  accumulateCoverageMetrics,
  computeProjectCoverage,
  finalizeCoveragePercentages,
} = require('../aggregate-results');

/**
 * Tests for per-project coverage computation helpers.
 * Validates that coverage metrics are correctly accumulated, projected, and finalized.
 */

describe('Coverage Helpers', () => {
  describe('accumulateCoverageMetrics', () => {
    it('should accumulate coverage metrics immutably', () => {
      const accumulator = {
        lines: { total: 100, covered: 80 },
        branches: { total: 50, covered: 40 },
        functions: { total: 20, covered: 15 },
        statements: { total: 100, covered: 80 },
      };

      const metrics = {
        lines: { total: 50, covered: 40 },
        branches: { total: 25, covered: 20 },
        functions: { total: 10, covered: 8 },
        statements: { total: 50, covered: 40 },
      };

      const result = accumulateCoverageMetrics(accumulator, metrics);

      // Verify immutability: original should not be modified
      expect(accumulator.lines.total).toBe(100);
      expect(accumulator.lines.covered).toBe(80);

      // Verify accumulation
      expect(result.lines.total).toBe(150);
      expect(result.lines.covered).toBe(120);
      expect(result.branches.total).toBe(75);
      expect(result.branches.covered).toBe(60);
      expect(result.functions.total).toBe(30);
      expect(result.functions.covered).toBe(23);
      expect(result.statements.total).toBe(150);
      expect(result.statements.covered).toBe(120);
    });

    it('should handle empty accumulator', () => {
      const accumulator = {
        lines: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 },
      };

      const metrics = {
        lines: { total: 100, covered: 80 },
        branches: { total: 50, covered: 40 },
        functions: { total: 20, covered: 15 },
        statements: { total: 100, covered: 80 },
      };

      const result = accumulateCoverageMetrics(accumulator, metrics);

      expect(result.lines.total).toBe(100);
      expect(result.lines.covered).toBe(80);
    });
  });

  describe('computeProjectCoverage', () => {
    it('should compute coverage for api project (no prefix)', () => {
      const summary = {
        lines: { total: 200, covered: 160 },
        branches: { total: 100, covered: 70 },
        functions: { total: 40, covered: 32 },
        statements: { total: 200, covered: 160 },
      };

      const result = computeProjectCoverage(summary, []);

      expect(result.lines.pct).toBe(80);
      expect(result.branches.pct).toBe(70);
      expect(result.functions.pct).toBe(80);
    });

    it('should compute coverage for frontend-next project (with :: prefix)', () => {
      const summary = {
        'frontend-next::lines': { total: 300, covered: 210 },
        'frontend-next::branches': { total: 150, covered: 105 },
        'frontend-next::functions': { total: 60, covered: 42 },
        'frontend-next::statements': { total: 300, covered: 210 },
        lines: { total: 200, covered: 160 },
        branches: { total: 100, covered: 70 },
        functions: { total: 40, covered: 32 },
        statements: { total: 200, covered: 160 },
      };

      const result = computeProjectCoverage(summary, ['frontend-next']);

      expect(result.lines.pct).toBe(70);
      expect(result.branches.pct).toBe(70);
      expect(result.functions.pct).toBe(70);
    });

    it('should compute coverage for multiple projects', () => {
      const summary = {
        'api::lines': { total: 200, covered: 160 },
        'api::branches': { total: 100, covered: 70 },
        'frontend-next::lines': { total: 300, covered: 210 },
        'frontend-next::branches': { total: 150, covered: 105 },
        lines: { total: 500, covered: 370 },
        branches: { total: 250, covered: 175 },
      };

      const apiResult = computeProjectCoverage(summary, ['api']);
      const frontendResult = computeProjectCoverage(summary, ['frontend-next']);

      expect(apiResult.lines.pct).toBe(80);
      expect(frontendResult.lines.pct).toBe(70);
    });

    it('should handle zero coverage', () => {
      const summary = {
        lines: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 },
      };

      const result = computeProjectCoverage(summary, []);

      expect(result.lines.pct).toBe(0);
      expect(result.branches.pct).toBe(0);
    });
  });

  describe('finalizeCoveragePercentages', () => {
    it('should finalize coverage percentages with correct rounding', () => {
      const accumulator = {
        lines: { total: 3, covered: 2 },
        branches: { total: 3, covered: 2 },
        functions: { total: 100, covered: 99 },
        statements: { total: 100, covered: 99 },
      };

      const result = finalizeCoveragePercentages(accumulator);

      expect(result.lines.pct).toBe(66.67);
      expect(result.branches.pct).toBe(66.67);
      expect(result.functions.pct).toBe(99);
      expect(result.statements.pct).toBe(99);
    });

    it('should handle 100% coverage', () => {
      const accumulator = {
        lines: { total: 100, covered: 100 },
        branches: { total: 100, covered: 100 },
        functions: { total: 100, covered: 100 },
        statements: { total: 100, covered: 100 },
      };

      const result = finalizeCoveragePercentages(accumulator);

      expect(result.lines.pct).toBe(100);
      expect(result.branches.pct).toBe(100);
      expect(result.functions.pct).toBe(100);
      expect(result.statements.pct).toBe(100);
    });

    it('should preserve total/covered counts', () => {
      const accumulator = {
        lines: { total: 250, covered: 200 },
        branches: { total: 100, covered: 75 },
        functions: { total: 50, covered: 40 },
        statements: { total: 250, covered: 200 },
      };

      const result = finalizeCoveragePercentages(accumulator);

      expect(result.lines.total).toBe(250);
      expect(result.lines.covered).toBe(200);
      expect(result.branches.total).toBe(100);
      expect(result.branches.covered).toBe(75);
    });
  });
});
