/**
 * Pure stopwatch business logic (no DOM access).
 */

/** @typedef {{
 *   isRunning: boolean,
 *   startEpochMs: number | null,
 *   elapsedMs: number
 * }} StopwatchState */

/**
 * Create a new stopwatch state.
 * @returns {StopwatchState}
 */
export function createState() {
  return { isRunning: false, startEpochMs: null, elapsedMs: 0 };
}

/**
 * Start the stopwatch; if already running, returns same state.
 * @param {StopwatchState} state
 * @param {number} nowMs
 * @returns {StopwatchState}
 */
export function start(state, nowMs) {
  if (state.isRunning) return state;
  const startEpochMs = nowMs - state.elapsedMs;
  return { ...state, isRunning: true, startEpochMs };
}

/**
 * Stop the stopwatch; if not running, returns same state.
 * @param {StopwatchState} state
 * @param {number} nowMs
 * @returns {StopwatchState}
 */
export function stop(state, nowMs) {
  if (!state.isRunning) return state;
  const startEpochMs = state.startEpochMs ?? nowMs;
  const elapsedMs = nowMs - startEpochMs;
  return { isRunning: false, startEpochMs: null, elapsedMs };
}

/**
 * Reset the stopwatch to zero; preserves running state (stops it).
 * @param {StopwatchState} _state
 * @returns {StopwatchState}
 */
export function reset(_state) {
  return { isRunning: false, startEpochMs: null, elapsedMs: 0 };
}

/**
 * Compute current elapsed milliseconds.
 * @param {StopwatchState} state
 * @param {number} nowMs
 */
export function getElapsedMs(state, nowMs) {
  return state.isRunning && state.startEpochMs != null
    ? nowMs - state.startEpochMs
    : state.elapsedMs;
}

/**
 * Format milliseconds into mm:ss.SSS
 * @param {number} ms
 */
export function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const millis = (ms % 1000).toString().padStart(3, '0');
  return `${minutes}:${seconds}.${millis}`;
}

/**
 * Produce a CSV snapshot of current time.
 * @param {StopwatchState} state
 * @param {number} nowMs
 */
export function toCsv(state, nowMs) {
  const elapsed = getElapsedMs(state, nowMs);
  const formatted = formatElapsed(elapsed);
  return `elapsed_ms,elapsed_formatted\n${elapsed},${formatted}\n`;
}

export default {
  createState,
  start,
  stop,
  reset,
  getElapsedMs,
  formatElapsed,
  toCsv,
};
