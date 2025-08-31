const assert = require('assert');
const fs = require('fs');
const { spawnSync } = require('child_process');

const testTodoFile = './test-todo.json';

// Helper function that captures both stdout and stderr
function runCommand(command) {
  const args = ['todo-app.js', '--test', ...command.split(' ')];
  const result = spawnSync('node', args, { encoding: 'utf-8' });
  
  // Combine stdout and stderr for assertion checks
  return (result.stdout + result.stderr).trim();
}

console.log('Running To-Do App tests with fixed app...');
if (fs.existsSync(testTodoFile)) {
  fs.unlinkSync(testTodoFile);
}

try {
  // Test 1: Add
  console.log('\nTest 1: Add task');
  let output = runCommand('add "Test task 1"');
  console.log(`Command output: ${output}`);
  
  let todos = JSON.parse(fs.readFileSync(testTodoFile));
  console.log(`Todos after add: ${JSON.stringify(todos)}`);
  
  assert.strictEqual(todos.length, 1, 'Test 1 Failed: Add');
  console.log('✅ Test 1 passed');

  // Test 2: Toggle
  console.log('\nTest 2: Toggle task');
  output = runCommand('toggle 1');
  console.log(`Command output: ${output}`);
  
  todos = JSON.parse(fs.readFileSync(testTodoFile));
  console.log(`Todos after toggle: ${JSON.stringify(todos)}`);
  
  assert.strictEqual(todos[0].completed, true, 'Test 2 Failed: Toggle');
  console.log('✅ Test 2 passed');

  // Test 3: Remove
  console.log('\nTest 3: Remove task');
  output = runCommand('remove 1');
  console.log(`Command output: ${output}`);
  
  todos = JSON.parse(fs.readFileSync(testTodoFile));
  console.log(`Todos after remove: ${JSON.stringify(todos)}`);
  
  assert.strictEqual(todos.length, 0, 'Test 3 Failed: Remove');
  console.log('✅ Test 3 passed');

  // Test 4: Invalid Toggle
  console.log('\nTest 4: Invalid Toggle');
  output = runCommand('toggle 99');
  console.log(`Command output: ${output}`);
  
  assert.ok(output.includes('Error: Please provide a valid index to toggle.'), 'Test 4 Failed: Invalid Toggle');
  console.log('✅ Test 4 passed');

  // Test 5: Invalid Remove
  console.log('\nTest 5: Invalid Remove');
  output = runCommand('remove 99');
  console.log(`Command output: ${output}`);
  
  assert.ok(output.includes('Error: Please provide a valid index to remove.'), 'Test 5 Failed: Invalid Remove');
  console.log('✅ Test 5 passed');

  // Test 6: Empty Filter
  console.log('\nTest 6: Empty Filter');
  output = runCommand('filter nonexistent');
  console.log(`Command output: ${output}`);
  
  assert.ok(output.includes('No to-dos found with priority'), 'Test 6 Failed: Empty Filter');
  console.log('✅ Test 6 passed');

  console.log('\nAll To-Do App tests passed! 🎉');
} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  process.exit(1);
} finally {
  // Clean up
  if (fs.existsSync(testTodoFile)) {
    fs.unlinkSync(testTodoFile);
    console.log('Cleaned up test file');
  }
}