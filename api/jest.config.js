/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  collectCoverage: true,
  coverageReporters: ["json", "json-summary", "lcov", "text-summary"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
    },
  },
  moduleNameMapper: {
    '^#tsApp$': '<rootDir>/src/app.ts',
  },
};