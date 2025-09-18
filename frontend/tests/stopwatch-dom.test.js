import { initStopwatch } from '../src/stopwatch-dom.js';

describe('stopwatch-dom', () => {
  it('wires buttons and updates display', () => {
    document.body.innerHTML = `
      <div>
        <div id="timer-display">--</div>
        <button id="btn-toggle">Start</button>
        <button id="btn-reset">Reset</button>
        <button id="btn-export">Export to CSV</button>
      </div>
    `;

    const fakeWin = {
      _fn: null,
      setInterval(fn) {
        this._fn = fn;
        return 1;
      },
      clearInterval() {},
    };

    // Deterministic clock
    vi.spyOn(Date, 'now').mockReturnValue(0);
    const api = initStopwatch(document, fakeWin);
    expect(document.querySelector('#timer-display').textContent).toBe(
      '00:00.000'
    );
    expect(document.querySelector('#btn-toggle').textContent).toBe('Start');

    // Start at t=1000ms
    Date.now.mockReturnValue(1000);
    document.querySelector('#btn-toggle').click();
    expect(document.querySelector('#btn-toggle').textContent).toBe('Stop');

    // Tick to t=1500ms
    Date.now.mockReturnValue(1500);
    fakeWin._fn && fakeWin._fn();
    expect(document.querySelector('#timer-display').textContent).toBe(
      '00:00.500'
    );

    // Stop at t=2000ms
    Date.now.mockReturnValue(2000);
    document.querySelector('#btn-toggle').click();
    expect(document.querySelector('#timer-display').textContent).toBe(
      '00:01.000'
    );

    // Reset
    document.querySelector('#btn-reset').click();
    expect(document.querySelector('#timer-display').textContent).toBe(
      '00:00.000'
    );

    // Export path (ensure it runs without error)
    // Polyfill createObjectURL for JSDOM
    if (!URL.createObjectURL) {
      // @ts-ignore
      URL.createObjectURL = () => 'blob://x';
    }
    const urlSpy = vi.spyOn(URL, 'createObjectURL');
    if (!URL.revokeObjectURL) {
      // @ts-ignore
      URL.revokeObjectURL = () => {};
    }
    document.querySelector('#btn-export').click();
    expect(urlSpy).toHaveBeenCalled();
    urlSpy.mockRestore();

    api.render(0);
  });
});
