/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: false,
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  // Do NOT enable coverage; it breaks ts-jest isolatedModules mode.
  // Use: pnpm test:coverage (manual invocation only if needed)
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts', '!src/**/types.ts'],
  coverageReporters: ['json', 'json-summary', 'lcov', 'text-summary'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '\\.test\\.ts$', '\\.spec\\.ts$'],
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    // Force contract tests to use TypeScript app with new middleware
    '^../../src/app$': '<rootDir>/src/app.ts',
    '^#tsApp$': '<rootDir>/src/app.ts',
  },
};
