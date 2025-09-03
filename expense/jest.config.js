module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/tests/**/*.js'],
  transform: {},
  coverageReporters: ['json', 'lcov', 'text-summary'],
};
