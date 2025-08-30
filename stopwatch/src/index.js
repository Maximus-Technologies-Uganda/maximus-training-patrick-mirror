const fs = require('fs');
const path = require('path');

const STATE_FILE = path.resolve(__dirname, '..', 'stopwatch-state.json');

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return { startTime: null, isRunning: false, elapsedTime: 0, laps: [] };
    const raw = fs.readFileSync(STATE_FILE, 'utf8').trim();
    if (!raw) return { startTime: null, isRunning: false, elapsedTime: 0, laps: [] };
    const parsed = JSON.parse(raw);
    const elapsedTime = Number(parsed.elapsedTime) || 0;
    const laps = Array.isArray(parsed.laps) ? parsed.laps : [];
    const startTime = typeof parsed.startTime === 'number' ? parsed.startTime : null;
    const isRunning = parsed.isRunning === true;
    return { startTime, isRunning, elapsedTime, laps };
  } catch (e) {
    return { startTime: null, isRunning: false, elapsedTime: 0, laps: [] };
  }
}

function saveState(state) {
  const toWrite = {
    startTime: typeof state.startTime === 'number' ? state.startTime : null,
    isRunning: state.isRunning === true,
    elapsedTime: Number(state.elapsedTime) || 0,
    laps: Array.isArray(state.laps) ? state.laps : []
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(toWrite, null, 2) + '\n', 'utf8');
}

function pad(num, width) {
  return String(num).padStart(width, '0');
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  ms = Math.floor(ms);
  const hours = Math.floor(ms / 3600000);
  ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000);
  ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  const millis = ms - seconds * 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

function parseExportArgs(argv) {
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--out=')) {
      out = token.slice('--out='.length);
    } else if (token === '--out') {
      out = argv[++i];
    }
  }
  return { out };
}

function handleExport() {
  const argv = process.argv.slice(3);
  const { out } = parseExportArgs(argv);

  if (!out || out.trim() === '') {
    console.error('Error: --out=<filename> is required.');
    process.exitCode = 1;
    return;
  }

  const { elapsedTime, laps } = loadState();
  if (!Array.isArray(laps) || laps.length === 0) {
    console.log('No laps recorded.');
    return;
  }

  const lines = [];
  lines.push(`Total: ${formatDuration(elapsedTime)}`);

  if (Array.isArray(laps) && laps.length > 0) {
    let index = 1;
    for (const lap of laps) {
      let ms = null;
      if (typeof lap === 'number') {
        ms = lap;
      } else if (lap && typeof lap === 'object') {
        const candidates = [lap.duration, lap.time, lap.elapsedTime];
        for (const c of candidates) {
          if (typeof c === 'number') { ms = c; break; }
        }
      }
      if (typeof ms === 'number') {
        lines.push(`Lap ${index}: ${formatDuration(ms)}`);
        index++;
      }
    }
  }

  const outPath = path.resolve(process.cwd(), out);
  try {
    fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
    console.log(`Exported stopwatch report to ${outPath}`);
  } catch (e) {
    console.error('Error: failed to write output file:', e.message);
    process.exitCode = 1;
  }
}

if (process.argv[2] === 'export') {
  handleExport();
}

function handleLap() {
  const { startTime, isRunning, elapsedTime, laps } = loadState();
  const hasStarted = typeof startTime === 'number' && startTime > 0;
  if (!hasStarted || !isRunning) {
    console.error('Error: stopwatch has not been started.');
    process.exitCode = 1;
    return;
  }

  const currentElapsed = (Date.now() - startTime) + (Number(elapsedTime) || 0);
  const previousTotal = Array.isArray(laps)
    ? laps.reduce((sum, lap) => {
        if (typeof lap === 'number') return sum + lap;
        if (lap && typeof lap === 'object' && typeof lap.duration === 'number') return sum + lap.duration;
        if (lap && typeof lap === 'object' && typeof lap.time === 'number') return sum + lap.time;
        if (lap && typeof lap === 'object' && typeof lap.elapsedTime === 'number') return sum + lap.elapsedTime;
        return sum;
      }, 0)
    : 0;

  let lapDuration = currentElapsed - previousTotal;
  if (!Number.isFinite(lapDuration) || lapDuration < 0) lapDuration = 0;

  const newLaps = Array.isArray(laps) ? laps.slice() : [];
  newLaps.push(lapDuration);
  saveState({ startTime, isRunning: true, elapsedTime, laps: newLaps });
  console.log(`Lap ${newLaps.length}: ${formatDuration(lapDuration)}`);
}

if (process.argv[2] === 'lap') {
  handleLap();
}

function handleReset() {
  try {
    saveState({ startTime: null, isRunning: false, elapsedTime: 0, laps: [] });
    console.log('Stopwatch state reset.');
  } catch (e) {
    console.error('Error: failed to reset stopwatch state:', e.message);
    process.exitCode = 1;
  }
}

if (process.argv[2] === 'reset') {
  handleReset();
}
