const fs = require('fs');
const path = require('path');

// Mock process.argv and console to test index.js functions directly
const originalArgv = process.argv;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock argsHelper.exitWithError to prevent actual process exit
const mockExitWithError = jest.fn();
jest.mock('../../helpers/args', () => ({
  exitWithError: mockExitWithError
}));

const DATA = path.resolve(__dirname, '../todos.json');

// Import the index module to access its internal functions
let indexModule;

describe('index.js smoke test', () => {
  let mockConsoleLog;
  let mockConsoleError;

  beforeEach(() => {
    // Ensure clean state for each test
    fs.writeFileSync(DATA, '[]\n', 'utf8');

    // Mock console methods
    mockConsoleLog = jest.fn();
    mockConsoleError = jest.fn();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Clear module cache and re-import
    const indexPath = require.resolve('../src/index.js');
    delete require.cache[indexPath];
    indexModule = require('../src/index.js');
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  test('index.js readTodos function executes successfully', () => {
    // Test the readTodos function directly
    expect(() => {
      indexModule.readTodos();
    }).not.toThrow();
  });

  test('index.js writeTodos function executes successfully', () => {
    // Test the writeTodos function directly
    const testData = [{ id: 1, text: 'test', completed: false }];
    expect(() => {
      indexModule.writeTodos(testData);
    }).not.toThrow();
  });

  test('index.js handleList executes without crashing', () => {
    // Test the handleList function directly
    expect(() => {
      indexModule.handleList();
    }).not.toThrow();
  });

  test('index.js handleAdd executes successfully', () => {
    // Mock process.argv for add command
    process.argv = ['node', 'index.js', 'add', 'Test task'];

    // Test the handleAdd function directly
    expect(() => {
      indexModule.handleAdd();
    }).not.toThrow();
  });

  test('index.js handleComplete executes successfully', () => {
    // First add a task
    process.argv = ['node', 'index.js', 'add', 'Task to complete'];
    indexModule.handleAdd();

    // Now test complete command
    process.argv = ['node', 'index.js', 'complete', '1'];

    // Test the handleComplete function directly
    expect(() => {
      indexModule.handleComplete();
    }).not.toThrow();
  });

  test('index.js handleRemove executes successfully', () => {
    // First add a task
    process.argv = ['node', 'index.js', 'add', 'Task to remove'];
    indexModule.handleAdd();

    // Now test remove command
    process.argv = ['node', 'index.js', 'remove', '1'];

    // Test the handleRemove function directly
    expect(() => {
      indexModule.handleRemove();
    }).not.toThrow();
  });

  test('index.js handleHelp executes successfully', () => {
    // Test the handleHelp function directly
    expect(() => {
      indexModule.handleHelp();
    }).not.toThrow();
  });

  test('index.js handleList with dueToday filter', () => {
    // Mock process.argv for list command with dueToday
    process.argv = ['node', 'index.js', 'list', '--dueToday'];

    // Test the handleList function directly
    expect(() => {
      indexModule.handleList();
    }).not.toThrow();
  });

  test('index.js handleList with highPriority filter', () => {
    // Mock process.argv for list command with highPriority
    process.argv = ['node', 'index.js', 'list', '--highPriority'];

    // Test the handleList function directly
    expect(() => {
      indexModule.handleList();
    }).not.toThrow();
  });

  test('index.js handleAdd with due date', () => {
    // Mock process.argv for add command with due date
    process.argv = ['node', 'index.js', 'add', 'Task with due date', '--due', '2024-12-25'];

    // Test the handleAdd function directly
    expect(() => {
      indexModule.handleAdd();
    }).not.toThrow();
  });

  test('index.js handleAdd with high priority', () => {
    // Mock process.argv for add command with high priority
    process.argv = ['node', 'index.js', 'add', 'High priority task', '--priority', 'high'];

    // Test the handleAdd function directly
    expect(() => {
      indexModule.handleAdd();
    }).not.toThrow();
  });

  test('index.js handleAdd with low priority', () => {
    // Mock process.argv for add command with low priority
    process.argv = ['node', 'index.js', 'add', 'Low priority task', '--priority', 'low'];

    // Test the handleAdd function directly
    expect(() => {
      indexModule.handleAdd();
    }).not.toThrow();
  });
});