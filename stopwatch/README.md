## Stopwatch CLI

### Overview
Command-line stopwatch to measure elapsed time and record laps. It can start/stop timing, capture lap splits, display status, and export a human-readable report. State is stored in `stopwatch/stopwatch-state.json`.

### Supported commands
- **start**: Begin timing. If already running, has no effect.
- **stop**: Stop timing and persist the accumulated elapsed time.
- **lap**: Record a lap split while running; prints the latest lap duration.
- **status**: Show whether the stopwatch is running, the total elapsed time, and lap count.
- **export**: Write a readable report of the total time and all laps to a file via `--out=<filename>`.

### Usage examples

#### start
```bash
node stopwatch/src/index.js start
```

#### stop
```bash
node stopwatch/src/index.js stop
```

#### lap
```bash
node stopwatch/src/index.js lap
```

#### status
```bash
node stopwatch/src/index.js status
```

#### export
```bash
# Exports a human-readable report to report.txt
node stopwatch/src/index.js export --out=report.txt
```

### Running tests
```bash
node stopwatch/tests/test.js
```

### Demo
![Stopwatch demo](../docs/stopwatch-demo.gif)


