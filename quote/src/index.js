#!/usr/bin/env node

const path = require('path');
const { loadJSON } = require('../../helpers/io.js');

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
  console.log('Usage: node index.js [--by=<author>]');
}

function main() {
  try {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const quotesPath = path.resolve(__dirname, 'quotes.json');
    const loaded = loadJSON(quotesPath);
    const quotes = Array.isArray(loaded)
      ? loaded.filter(q => q && typeof q.text === 'string' && q.text.trim() && typeof q.author === 'string' && q.author.trim())
      : [];

    if (quotes.length === 0) {
      console.error('Error: No quotes available. Ensure quotes.json exists beside index.js.');
      process.exit(1);
    }

    let pool = quotes;
    if (args.by) {
      pool = filterQuotesByAuthor(quotes, args.by);
      if (pool.length === 0) {
        console.error(`Error: No quotes found for author "${args.by}".`);
        process.exit(1);
      }
    }

    const choice = selectRandom(pool);
    console.log(`${choice.text} - ${choice.author}`);
  } catch (err) {
    console.error('Unexpected error:', err && err.message ? err.message : String(err));
    process.exit(1);
  }
}

if (require.main === module) { main(); }

module.exports = { parseArgs, selectRandom, filterQuotesByAuthor };


