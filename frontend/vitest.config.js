/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**'],
      exclude: [
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/main.js',
        'src/counter.js',
        'src/test-setup.js',
      ],
      thresholds: {
        perFile: true,
        statements: 40,
        branches: 40,
        functions: 40,
        lines: 40,
      },
    },
    exclude: [
      '**/node_modules/**',
      '**/tests/**/*.spec.{js,jsx,ts,tsx}', // Exclude Playwright specs only
      '**/playwright*.config.js'
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'node14',
  },
});
