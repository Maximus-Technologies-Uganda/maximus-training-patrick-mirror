import {
  createState,
  start,
  stop,
  reset,
  getElapsedMs,
  formatElapsed,
  toCsv,
} from '../src/stopwatch-core.js';

describe('stopwatch-core', () => {
  it.each([
    { steps: ['start', 1000, 'stop', 1500], expectMs: 500 },
    { steps: ['start', 0, 'stop', 2000], expectMs: 2000 },
    { steps: ['start', 100, 'stop', 100], expectMs: 0 },
  ])('accumulates elapsed correctly %#', ({ steps, expectMs }) => {
    let state = createState();
    for (let i = 0; i < steps.length; i += 2) {
      const action = steps[i];
      const now = steps[i + 1];
      if (action === 'start') state = start(state, now);
      if (action === 'stop') state = stop(state, now);
    }
    const actual = getElapsedMs(state, steps[steps.length - 1]);
    expect(actual).toBe(expectMs);
  });

  it('reset clears elapsed and stops', () => {
    let state = createState();
    state = start(state, 0);
    state = stop(state, 500);
    state = reset(state);
    expect(state.isRunning).toBe(false);
    expect(state.elapsedMs).toBe(0);
  });

  it('formats and exports CSV', () => {
    let state = createState();
    state = start(state, 0);
    state = stop(state, 1234);
    expect(formatElapsed(getElapsedMs(state, 1234))).toBe('00:01.234');
    const csv = toCsv(state, 1234);
    expect(csv.split('\n')[0]).toBe('elapsed_ms,elapsed_formatted');
  });
});
