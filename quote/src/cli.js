const { getRandomQuote, formatQuote } = require('./core');

function parseArgs(argv) {
  const out = { by: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--by' && i + 1 < argv.length) { out.by = argv[++i]; continue; }
    if (arg.startsWith('--by=')) { out.by = arg.slice(5); continue; }
    if (arg === '-h' || arg === '--help') { out.help = true; continue; }
  }
  return out;
}

function printHelp() {
  console.log('Usage: quote [--by=<author>]');
}

function run(argv = process.argv) {
  try {
    const args = parseArgs(argv);
    if (args.help) { printHelp(); return 0; }

    const result = getRandomQuote({ by: args.by });
    if (!result.ok) {
      console.error(result.error);
      return 1;
    }
    console.log(formatQuote(result.value));
    return 0;
  } catch (err) {
    console.error('Unexpected error:', err && err.message ? err.message : String(err));
    return 1;
  }
}

module.exports = { run, parseArgs };


