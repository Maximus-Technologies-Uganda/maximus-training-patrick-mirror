const { spawn } = require('child_process');
const path = require('path');

const tests = [
  { name: 'quote', script: 'quote/tests/test.js' },
  { name: 'expense', script: 'expense/tests/test.js' },
  { name: 'stopwatch', script: 'stopwatch/tests/test.js' },
  { name: 'todo', script: 'todo/tests/test.js' },
  { name: 'dev-week-1:expenses', script: 'repos/dev-week-1/test-expenses.js', optional: true },
  { name: 'dev-week-1:expense-tracker', script: 'repos/dev-week-1/test-expense-tracker.js', optional: true },
  { name: 'dev-week-1:todo-app', script: 'repos/dev-week-1/test-todo-app.js', optional: true },
  { name: 'dev-week-1:windows', script: 'repos/dev-week-1/test-windows.js', optional: true }
];

function runOne(name, scriptPath) {
  return new Promise((resolve) => {
    const abs = path.resolve(process.cwd(), scriptPath);
    const cwd = path.dirname(abs);
    const child = spawn(process.execPath, [abs], { stdio: 'inherit', cwd, windowsHide: true });
    child.on('close', (code) => resolve({ name, code }));
  });
}

async function main() {
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const scopeIdx = process.argv.indexOf('--scope');
  const scope = scopeIdx !== -1 ? process.argv[scopeIdx + 1] : null;

  const selected = tests.filter(t => {
    if (only) return t.name === only;
    if (scope) return t.name.startsWith(scope);
    return true;
  });

  let failures = 0;
  for (const t of selected) {
    console.log(`\n=== Running: ${t.name} ===`);
    try {
      const { code } = await runOne(t.name, t.script);
      if (code !== 0) {
        if (t.optional) {
          console.warn(`WARN optional test failed: ${t.name} (exit ${code})`);
        } else {
          console.error(`FAIL ${t.name} (exit ${code})`);
          failures++;
        }
      } else {
        console.log(`PASS ${t.name}`);
      }
    } catch (err) {
      if (t.optional) {
        console.warn(`WARN optional test error: ${t.name}: ${err && err.stack ? err.stack : err}`);
      } else {
        console.error(`ERROR ${t.name}:`, err && err.stack ? err.stack : err);
        failures++;
      }
    }
  }

  if (failures) {
    console.error(`\n${failures} required test group(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll required tests passed');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


