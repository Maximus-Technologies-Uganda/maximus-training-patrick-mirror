module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['<rootDir>/src/**/*.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  coverageReporters: ['json', 'lcov', 'text-summary'],
  transform: {},
};
