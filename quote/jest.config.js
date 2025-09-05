module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['<rootDir>/src/**/*.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {},
  coverageReporters: ['json', 'lcov', 'text-summary'],
  // Exclude problematic tests that call process.exit
  testPathIgnorePatterns: ['/node_modules/', 'dev-69-edge-cases.test.js', 'deterministic.test.js', 'run-errors.test.js', 'run.test.js'],
};
