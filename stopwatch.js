const fs = require('fs');
const stateFilePath = './stopwatch-state.json';

// Function to read the current state from the file
function readState() {
  // Check if the state file exists
  if (fs.existsSync(stateFilePath)) {
    const fileContent = fs.readFileSync(stateFilePath);
    return JSON.parse(fileContent);
  }
  // Default state if the file doesn't exist
  return { startTime: 0, isRunning: false };
}

// Function to write the current state to the file
function writeState(state) {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

// Get the current state
let state = readState();
const command = process.argv[2];

if (command === 'start') {
  if (state.isRunning) {
    console.log('Stopwatch is already running.');
  } else {
    state.startTime = Date.now();
    state.isRunning = true;
    writeState(state); // Save the new state
    console.log('Stopwatch started.');
  }
} else if (command === 'stop') {
  if (!state.isRunning) {
    console.log('Stopwatch is not running.');
  } else {
    const elapsedTime = Date.now() - state.startTime;
    console.log(`Elapsed time: ${elapsedTime / 1000} seconds.`);
    state.isRunning = false;
    writeState(state); // Save the new state
  }
} else if (command === 'reset') {
  // Now you can implement reset by changing the state and saving the file
  state.startTime = 0;
  state.isRunning = false;
  writeState(state);
  console.log('Stopwatch reset.');
} else {
  console.log('Unknown command. Please use start, stop, or reset.');
}