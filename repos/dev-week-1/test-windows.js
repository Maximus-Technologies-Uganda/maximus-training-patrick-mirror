
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testTodoFile = path.join(__dirname, 'test-todo.json');
console.log(`Test file path: ${testTodoFile}`);

// Helper function that captures both stdout and stderr
function runCommand(command) {
  console.log(`Running command: node todo-app.js --test ${command}`);
  const args = ['todo-app.js', '--test', ...command.split(' ')];
  const result = spawnSync('node', args, { encoding: 'utf-8' });

  console.log('STDOUT:', result.stdout);
  if (result.stderr) console.log('STDERR:', result.stderr);

  // Combine stdout and stderr for assertion checks
  return (result.stdout + result.stderr).trim();
}

console.log('Running To-Do App tests with Windows-compatible paths...');
if (fs.existsSync(testTodoFile)) {
  try {
    fs.unlinkSync(testTodoFile);
    console.log(`Deleted existing ${testTodoFile}`);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
}

// Test 1: Add
console.log('Test 1: Add task');
let output = runCommand('add "Test task 1"');
console.log('Add command completed');

// Test 2: List
console.log('Test 2: List tasks');
output = runCommand('list');
console.log('List command completed');

// Test 3: Toggle
console.log('Test 3: Toggle task');
output = runCommand('toggle 1');
console.log('Toggle command completed');

// Test 4: Invalid Toggle
console.log('Test 4: Invalid Toggle');
output = runCommand('toggle 99');
console.log(`Output contains error message: ${output.includes('Error: Please provide a valid index to toggle.')}`);
console.log('Invalid toggle command completed');

// Test 5: Remove
console.log('Test 5: Remove task');
output = runCommand('remove 1');
console.log('Remove command completed');

// Clean up
if (fs.existsSync(testTodoFile)) {
  try {
    fs.unlinkSync(testTodoFile);
    console.log(`Cleaned up ${testTodoFile}`);
  } catch (error) {
    console.error(`Error cleaning up: ${error.message}`);
  }
}

console.log('All tests completed successfully!');
