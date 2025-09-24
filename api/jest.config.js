/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  collectCoverage: true,
  coverageReporters: ["json", "json-summary", "lcov", "text-summary"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  moduleNameMapper: {
    '^#tsApp$': '<rootDir>/src/app.ts',
  },
};