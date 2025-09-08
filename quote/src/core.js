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
  const trimmed = typeof author === 'string' ? author.trim() : '';
  if (!trimmed) return [];
  const needle = trimmed.toLowerCase();
  return quotes.filter(q =>
    q && typeof q.author === 'string' && q.author.trim().toLowerCase() === needle
  );
}

function formatQuote(quote) {
  return `${quote.text} - ${quote.author}`;
}

function getRandomQuote(arg1 = {}, arg2 = {}) {
  // Backward-compatible argument handling:
  // - Legacy signature: getRandomQuote(quotesPath: string, by: string)
  // - Current signature: getRandomQuote({ by }, { quotesPath })
  let by;
  let quotesPath;
  if (typeof arg1 === 'string') {
    quotesPath = arg1;
  } else if (arg1 && typeof arg1 === 'object') {
    by = arg1.by;
  }
  if (typeof arg2 === 'string') {
    by = arg2;
  } else if (arg2 && typeof arg2 === 'object') {
    quotesPath = arg2.quotesPath;
  }

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
  const normalizedBy = typeof by === 'string' ? by.trim() : by;
  if (normalizedBy) {
    pool = filterByAuthor(quotes, normalizedBy);
    if (pool.length === 0) {
      return { ok: false, error: `No quotes found for author "${normalizedBy}".` };
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


