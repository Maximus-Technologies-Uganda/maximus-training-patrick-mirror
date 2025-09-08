// Test setup for Vitest
// This file runs before each test file

// Mock fetch for testing
global.fetch = vi.fn();

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
