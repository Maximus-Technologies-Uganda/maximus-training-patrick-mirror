const fs = require('fs');

// Use a test file if provided as an argument, otherwise use the default
const isTest = process.argv.includes('--test');
const todoFilePath = isTest ? './test-todo.json' : './todo.json';

// --- Helper Functions ---

function readTodos() {
  if (!fs.existsSync(todoFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(todoFilePath);
  if (fileContent.length === 0) {
    return [];
  }
  return JSON.parse(fileContent);
}

function writeTodos(todos) {
  fs.writeFileSync(todoFilePath, JSON.stringify(todos, null, 2));
}

function runCLI() {
  // --- Command Handling ---

  // Adjust command and args based on whether --test flag is present
  const commandIndex = isTest ? 3 : 2;
  const command = process.argv[commandIndex];
  const args = process.argv.slice(commandIndex + 1);
  const todos = readTodos();

  if (command === 'add') {
    const task = args[0];
    const priority = args[1] || 'normal';
    const dueDate = args[2] || null;

    if (!task) {
      logError('Error: Please provide a task description.');
      logError('Example: node todo-app.js add "My new task"');
      return;
    }

    const newTodo = {
      task,
      completed: false,
      priority,
      dueDate,
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
        const priority = `(Priority: ${todo.priority || 'N/A'})`;
        const due = todo.dueDate ? `(Due: ${todo.dueDate})` : '';
        console.log(`${index + 1}. ${status} ${todo.task} ${priority} ${due}`);
      });
      console.log('--------------------');
    }
  } else if (command === 'toggle') {
    const indexStr = args[0];
    const index = parseInt(indexStr, 10) - 1;

    if (Number.isNaN(index) || index < 0 || index >= todos.length) {
      logError('Error: Please provide a valid index to toggle.');
      return;
    }

    todos[index].completed = !todos[index].completed;
    writeTodos(todos);
    console.log('Toggled status for:', todos[index].task);
  } else if (command === 'remove') {
    const indexStr = args[0];
    const index = parseInt(indexStr, 10) - 1;

    if (Number.isNaN(index) || index < 0 || index >= todos.length) {
      logError('Error: Please provide a valid index to remove.');
      return;
    }

    const [removedTodo] = todos.splice(index, 1);
    writeTodos(todos);
    console.log(`Removed: "${removedTodo.task}"`);
  } else if (command === 'filter') {
    const priority = args[0];

    if (!priority) {
      logError('Error: Please provide a priority to filter by (e.g., high, normal).');
      return;
    }

    const filteredTodos = todos.filter((todo) => todo.priority === priority);

    if (filteredTodos.length === 0) {
      console.log(`No to-dos found with priority "${priority}".`);
    } else {
      console.log(`--- To-Dos with priority "${priority}" ---`);
      filteredTodos.forEach((todo, index) => {
        const status = todo.completed ? '[✅]' : '[ ]';
        console.log(`${index + 1}. ${status} ${todo.task}`);
      });
      console.log('------------------------------------');
    }
  } else {
    console.log('Unknown command. Use: add, list, toggle, remove, or filter.');
  }
}

// Helper function to print errors to both stderr and stdout when in test mode
function logError(message) {
  if (isTest) {
    console.error(message);
    console.log(message);
  } else {
    console.error(message);
  }
}

if (require.main === module) {
  runCLI();
}