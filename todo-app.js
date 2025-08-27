const fs = require('fs');
const todoFilePath = './todo.json';

// --- Helper Functions ---

// Function to read to-dos from the JSON file
function readTodos() {
  if (!fs.existsSync(todoFilePath)) {
    return []; // Return an empty list if the file doesn't exist
  }
  const fileContent = fs.readFileSync(todoFilePath);
  if (fileContent.length === 0) {
    return []; // Return an empty list if the file is empty
  }
  return JSON.parse(fileContent);
}

// Function to write to-dos to the JSON file
function writeTodos(todos) {
  fs.writeFileSync(todoFilePath, JSON.stringify(todos, null, 2));
}

// --- Command Handling ---

const command = process.argv[2];
const args = process.argv.slice(3);
let todos = readTodos();

if (command === 'add') {
  // TODO: Implement the 'add' logic
  const task = args.join(' '); // Join all arguments to form the task description
  const newTodo = {
    task: task,
    completed: false
  };
  todos.push(newTodo);
  writeTodos(todos);
  console.log(`Added: "${task}"`);
  
} else if (command === 'list') {
    if (todos.length === 0) {
      console.log('Your to-do list is empty!');
    } else {
      console.log('--- To-Do List ---');
      todos.forEach((todo, index) => {
        const status = todo.completed ? '[✅]' : '[ ]';
        // We add 1 to the index so the list starts at 1 instead of 0
        console.log(`${index + 1}. ${status} ${todo.task}`);
      });
      console.log('--------------------');
    }
  
} else if (command === 'toggle') {
    const indexStr = args[0];
    const index = parseInt(indexStr) - 1;
  
    // --- VALIDATION START ---
    if (isNaN(index) || index < 0 || index >= todos.length) {
      console.error('Error: Please provide a valid index to toggle.');
      return; // Stop the script
    }
    // --- VALIDATION END ---
  
    todos[index].completed = !todos[index].completed;
    writeTodos(todos);
    console.log('Toggled status for:', todos[index].task);
    // Check if the index is valid
    if (index >= 0 && index < todos.length) {
      // Flip the 'completed' status
      todos[index].completed = !todos[index].completed;
      writeTodos(todos);
      console.log('Toggled status for:', todos[index].task);
    } else {
      console.log('Invalid index. Please provide a valid number from the list.');
    }
  
} else if (command === 'remove') {
    const indexStr = args[0];
    const index = parseInt(indexStr) - 1;
  
    // --- VALIDATION START ---
    if (isNaN(index) || index < 0 || index >= todos.length) {
      console.error('Error: Please provide a valid index to remove.');
      return; // Stop the script
    }
    // --- VALIDATION END ---
  
    const removedTodo = todos.splice(index, 1);
    writeTodos(todos);
    console.log(`Removed: "${removedTodo[0].task}"`);
    // Check if the index is valid
    if (index >= 0 && index < todos.length) {
      // Use splice() to remove the item from the array
      const removedTodo = todos.splice(index, 1);
      writeTodos(todos);
      console.log(`Removed: "${removedTodo[0].task}"`);
    } else {
      console.log('Invalid index. Please provide a valid number from the list.');
    }
  
} else {
  console.log('Unknown command. Use: add, list, toggle, or remove.');
}