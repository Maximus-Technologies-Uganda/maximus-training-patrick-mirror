#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const argsHelper = require('../../helpers/args');

function selectRandom(items) {
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

function filterQuotesByAuthor(quotes, author) {
  if (!author) return quotes;
  const needle = author.trim().toLowerCase();
  return quotes.filter(q =>
    q && typeof q.author === 'string' && q.author.trim().toLowerCase() === needle
  );
}

function parseArgs(argv) {
  const out = { by: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--by' && i + 1 < argv.length) { out.by = argv[++i]; continue; }
    if (arg.startsWith('--by=')) { out.by = arg.slice(5); continue; }
    if (arg === '-h' || arg === '--help') { out.help = true; }
  }
  return out;
}

function printHelp() {
  console.log('Usage: node quote/src/index.js [--by=<author>]');
}

function run(argv = process.argv) {
  try {
    const args = parseArgs(argv);
    if (args.help) { printHelp(); return 0; }

    const quotesPath = path.resolve(__dirname, 'quotes.json');
    let quotes = [];
    try {
      if (!fs.existsSync(quotesPath)) {
        argsHelper.exitWithError('Error: No quotes available. Ensure quotes.json exists beside index.js.');
      }
      const raw = fs.readFileSync(quotesPath, 'utf8').trim();
      const loaded = raw ? JSON.parse(raw) : [];
      quotes = Array.isArray(loaded)
        ? loaded.filter(q => q && typeof q.text === 'string' && q.text.trim() && typeof q.author === 'string' && q.author.trim())
        : [];
      if (quotes.length === 0) {
        argsHelper.exitWithError('Error: No quotes available. Ensure quotes.json exists beside index.js.');
      }
    } catch (e) {
      argsHelper.exitWithError('Error: No quotes available. Ensure quotes.json exists beside index.js.');
    }

    let pool = quotes;
    if (args.by) {
      pool = filterQuotesByAuthor(quotes, args.by);
      if (pool.length === 0) {
        argsHelper.exitWithError(`Error: No quotes found for author "${args.by}".`);
      }
    }

    const choice = selectRandom(pool);
    console.log(`${choice.text} - ${choice.author}`);
    argsHelper.exitWithSuccess();
  } catch (err) {
    argsHelper.exitWithError(`Unexpected error: ${err && err.message ? err.message : String(err)}`);
  }
}

if (require.main === module) {
  run(process.argv);
}

module.exports = { run, parseArgs, selectRandom, filterQuotesByAuthor };


