## Testing setup

We use Node's built-in assert with a unified runner.

- Required suites: `quote`, `expense`, `stopwatch`, `todo`
- Optional legacy suites: `repos/dev-week-1/*`

### Commands

```bash
npm test              # run all required tests
npm run test:quote    # run a specific suite
npm run test:expense
npm run test:stopwatch
npm run test:todo

npm test -- --scope dev-week-1  # run only legacy suite group
```

### Conventions

- Tests live in `tests/test.js` per app and exit with code 0 on success.
- The runner sets each suite's working directory to ensure relative paths and child processes work consistently across OS/CI.


