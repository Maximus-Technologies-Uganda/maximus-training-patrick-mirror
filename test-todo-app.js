const assert = require('assert');
const fs = require('fs');
const { execSync } = require('child_process');

const testTodoFile = './test-todo.json';

// Helper function to run a command and get the output
function runCommand(command) {
  return execSync(`node todo-app.js ${command}`, { encoding: 'utf-8' });
}

// --- Test Suite ---
console.log('Running To-Do App tests...');

// Cleanup before starting
if (fs.existsSync(testTodoFile)) {
  fs.unlinkSync(testTodoFile);
}

// Test 1: Add a new to-do item
runCommand('add "Test task 1"');
let todos = JSON.parse(fs.readFileSync('./todo.json'));
assert.strictEqual(todos.length, 2, 'Test 1 Failed: Should have 2 to-do items after adding.'); // Assumes one from before
assert.strictEqual(todos[1].task, 'Test task 1', 'Test 1 Failed: Task description is incorrect.');

// Test 2: Toggle a to-do item
runCommand('toggle 2');
todos = JSON.parse(fs.readFileSync('./todo.json'));
assert.strictEqual(todos[1].completed, true, 'Test 2 Failed: Task should be marked as completed.');

// Test 3: Remove a to-do item
runCommand('remove 2');
todos = JSON.parse(fs.readFileSync('./todo.json'));
assert.strictEqual(todos.length, 1, 'Test 3 Failed: Should have 1 to-do item after removing.');

console.log('All To-Do App tests passed! 🎉');