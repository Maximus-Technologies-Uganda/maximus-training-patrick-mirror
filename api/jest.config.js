/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  collectCoverage: true,
  coverageReporters: ["json", "json-summary", "lcov", "text-summary"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    // Force contract tests to use TypeScript app with new middleware
    '^../../src/app$': '<rootDir>/src/app.ts',
    '^#tsApp$': '<rootDir>/src/app.ts',
  },
};