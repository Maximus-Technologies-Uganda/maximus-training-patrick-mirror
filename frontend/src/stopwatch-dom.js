import {
  createState,
  start,
  stop,
  reset,
  getElapsedMs,
  formatElapsed,
  toCsv,
} from './stopwatch-core.js';

/**
 * Wire up the stopwatch UI.
 * @param {Document} doc
 * @param {Window} win
 */
export function initStopwatch(doc = document, win = window) {
  const display = doc.querySelector('#timer-display');
  const btnToggle = doc.querySelector('#btn-toggle');
  const btnReset = doc.querySelector('#btn-reset');
  const btnExport = doc.querySelector('#btn-export');

  /** @type {ReturnType<typeof createState>} */
  let state = createState();
  let intervalId = null;

  function render(now = Date.now()) {
    if (!display) return;
    const ms = getElapsedMs(state, now);
    display.textContent = formatElapsed(ms);
    if (btnToggle) btnToggle.textContent = state.isRunning ? 'Stop' : 'Start';
  }

  function tick() {
    render(Date.now());
  }

  function handleToggle() {
    const now = Date.now();
    if (!state.isRunning) {
      state = start(state, now);
      if (!intervalId) intervalId = win.setInterval(tick, 50);
    } else {
      state = stop(state, now);
      if (intervalId) {
        win.clearInterval(intervalId);
        intervalId = null;
      }
    }
    render(now);
  }

  function handleReset() {
    state = reset(state);
    if (intervalId) {
      win.clearInterval(intervalId);
      intervalId = null;
    }
    render(Date.now());
  }

  function handleExport() {
    const csv = toCsv(state, Date.now());
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = 'stopwatch-export.csv';
    doc.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  btnToggle && btnToggle.addEventListener('click', handleToggle);
  btnReset && btnReset.addEventListener('click', handleReset);
  btnExport && btnExport.addEventListener('click', handleExport);

  render(Date.now());

  return {
    getState: () => state,
    render,
  };
}

export default { initStopwatch };
