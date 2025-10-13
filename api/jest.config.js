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
    '^#tsApp$': '<rootDir>/src/app.ts',
  },
};