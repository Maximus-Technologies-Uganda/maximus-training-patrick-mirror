module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/tests/**/*.js'],
  testPathIgnorePatterns: ['<rootDir>/tests/test\\.js'],
  transform: {},
  coverageReporters: ['json', 'lcov', 'text-summary'],
  maxWorkers: 1, // Run tests serially to avoid interference
};
