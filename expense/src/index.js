const fs = require('fs');
 const path = require('path');
const DATA_FILE = path.resolve(__dirname, '..', 'expenses.json');

function validateMonth(month) {
  if (typeof month !== 'string') return false;
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return y >= 1970 && mo >= 1 && mo <= 12;
}

function parseArgs(argv) {
  const args = { command: argv[2] || '', rest: argv.slice(3) };
  return args;
}

function parseReportArgs(tokens) {
  let month = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('--month=')) {
      month = t.slice('--month='.length);
    } else if (t === '--month') {
      month = tokens[++i];
    }
  }
  return { month };
}

function handleReport(tokens) {
  const { month } = parseReportArgs(tokens);
  if (!month || !validateMonth(month)) {
    console.error('Error: --month must be in YYYY-MM format with a valid month (01-12).');
    process.exitCode = 1;
    return;
  }
  console.log(`Report for ${month}`);
}

(function main() {
  const { command, rest } = parseArgs(process.argv);
  if (command === 'report') {
    handleReport(rest);
    return;
  }
  if (command === 'clear') {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2) + '\n', 'utf8');
      console.log('Cleared expenses.');
    } catch (e) {
      console.error('Error: failed to clear expenses:', e.message);
      process.exitCode = 1;
    }
    return;
  }
  console.error('Error: unknown command.');
  process.exitCode = 1;
})();
