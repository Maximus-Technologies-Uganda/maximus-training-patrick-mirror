const fs = require('fs');
const stateFilePath = './stopwatch-state.json';

// Function to read the current state from the file
function readState() {
  if (fs.existsSync(stateFilePath)) {
    const fileContent = fs.readFileSync(stateFilePath);
    if (fileContent.length === 0) {
      return { startTime: 0, isRunning: false, elapsedTime: 0 };
    }
    return JSON.parse(fileContent);
  }
  return { startTime: 0, isRunning: false, elapsedTime: 0 };
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
    state.elapsedTime = 0; // Reset elapsed time on new start
    writeState(state);
    console.log('Stopwatch started.');
  }
} else if (command === 'stop') {
  if (!state.isRunning) {
    console.log('Stopwatch is not running.');
  } else {
    state.elapsedTime = Date.now() - state.startTime;
    console.log(`Elapsed time: ${state.elapsedTime / 1000} seconds.`);
    state.isRunning = false;
    writeState(state);
  }
} else if (command === 'reset') {
  state.startTime = 0;
  state.isRunning = false;
  state.elapsedTime = 0;
  writeState(state);
  console.log('Stopwatch reset.');
} else if (command === 'export') {
  if (state.isRunning) {
    console.log('Please stop the stopwatch before exporting.');
    return;
  }
  const content = `Total Elapsed Time: ${state.elapsedTime / 1000} seconds\n`;
  fs.appendFileSync('./laps.txt', content);
  console.log('Results exported to laps.txt');
} else {
  console.log('Unknown command. Use: start, stop, reset, or export.');
}