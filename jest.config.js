module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text-summary'],
  testPathIgnorePatterns: [
    // Exclude frontend-next tests as they use Vitest
    '<rootDir>/frontend-next/',
    // Exclude Playwright e2e tests
    '<rootDir>/frontend/tests/',
    '<rootDir>/frontend-next/tests/',
    '<rootDir>/api/tests/',
  ],
  testMatch: [
    // Only include .test.js files from specific directories
    '<rootDir>/quote/tests/**/*.test.js',
    '<rootDir>/expense/tests/**/*.test.js',
    '<rootDir>/stopwatch/tests/**/*.test.js',
    '<rootDir>/todo/tests/**/*.test.js',
    '<rootDir>/repos/dev-week-1/**/*.test.js',
  ],
};


