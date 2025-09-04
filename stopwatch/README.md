## Stopwatch CLI

### Overview
Command-line stopwatch to measure elapsed time and record laps. It can start/stop timing, capture lap splits, display status, and export a human-readable report. State is stored in `stopwatch/stopwatch-state.json`.

### Supported commands
- **start**: Begin timing. If already running, has no effect.
- **stop**: Stop timing and persist the accumulated elapsed time.
- **reset**: Clear state (elapsed time and laps).
- **export**: Write a readable report to a file via `--out=<filename>`. If there are no laps, prints "No laps recorded." and does not write a file.

### Usage

#### start
```bash
node stopwatch/src/index.js start
```

#### stop
```bash
node stopwatch/src/index.js stop
```

#### reset
```bash
node stopwatch/src/index.js reset
```

#### export
```bash
# Exports a human-readable report to report.txt
node stopwatch/src/index.js export --out=report.txt
```

If no laps have been recorded yet:
```bash
node stopwatch/src/index.js export --out=empty.txt
# -> prints: "No laps recorded." and does not create empty.txt
```

### Exit Codes
- **0**: Success - Command executed successfully.
- **1**: Error - Invalid arguments, malformed flags, stopwatch not started, or other runtime errors.

### Running tests
```bash
node stopwatch/tests/test.js
# Or run Jest for golden-file tests
npm --prefix stopwatch test --silent
```

### Demo
![Stopwatch demo](../docs/stopwatch-demo.gif)


<!-- touch: ensure this README is explicitly included in a follow-up commit -->
