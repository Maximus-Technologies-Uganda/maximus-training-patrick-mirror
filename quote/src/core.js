const fs = require('fs');
const path = require('path');

function sanitizeQuotes(rawQuotes) {
  if (!Array.isArray(rawQuotes)) return [];
  return rawQuotes.filter(q =>
    q && typeof q.text === 'string' && q.text.trim() && typeof q.author === 'string' && q.author.trim()
  );
}

function readQuotesFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const parsed = JSON.parse(content || '[]');
  return sanitizeQuotes(parsed);
}

function getDefaultQuotesPath() {
  return path.resolve(__dirname, 'quotes.json');
}

function selectRandom(items) {
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

function filterByAuthor(quotes, author) {
  if (!author) return quotes;
  const needle = author.trim().toLowerCase();
  if (!needle) return [];
  return quotes.filter(q =>
    q && typeof q.author === 'string' && q.author.trim().toLowerCase() === needle
  );
}

function formatQuote(quote) {
  return `${quote.text} - ${quote.author}`;
}

function getRandomQuote({ by } = {}, { quotesPath } = {}) {
  const pathToUse = quotesPath || getDefaultQuotesPath();
  let quotes;
  try {
    quotes = readQuotesFromFile(pathToUse);
  } catch (_e) {
    return { ok: false, error: 'No quotes available. Ensure quotes.json exists beside index.js.' };
  }
  if (!quotes || quotes.length === 0) {
    return { ok: false, error: 'No quotes available. Ensure quotes.json exists beside index.js.' };
  }
  let pool = quotes;
  if (by) {
    pool = filterByAuthor(quotes, by);
    if (pool.length === 0) {
      return { ok: false, error: `No quotes found for author "${by}".` };
    }
  }
  const choice = selectRandom(pool);
  return { ok: true, value: choice };
}

module.exports = {
  sanitizeQuotes,
  readQuotesFromFile,
  getDefaultQuotesPath,
  selectRandom,
  filterByAuthor,
  formatQuote,
  getRandomQuote,
};


