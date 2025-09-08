module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // Focus coverage on pure core logic; the CLI is validated by a smoke test
  collectCoverageFrom: ['src/core.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/tests/test\\.js$'],
  transform: {},
  coverageReporters: ['json', 'json-summary', 'lcov', 'text-summary'],
};
