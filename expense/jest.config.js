module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // Focus coverage on pure core logic; the CLI is validated by a smoke test
  collectCoverageFrom: ['src/core.js'],
  testMatch: ['**/tests/**/*.js'],
  transform: {},
  coverageReporters: ['json', 'lcov', 'text-summary'],
};
