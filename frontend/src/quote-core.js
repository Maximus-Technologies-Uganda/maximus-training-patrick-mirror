// Core quote logic extracted for testing
// This module contains the business logic for quote operations

/**
 * Sanitize and validate quotes data
 * @param {Array} rawQuotes - Raw quotes array
 * @returns {Array} - Sanitized quotes array
 */
export function sanitizeQuotes(rawQuotes) {
  if (!Array.isArray(rawQuotes)) return [];
  return rawQuotes.filter(q =>
    q && typeof q.text === 'string' && q.text.trim() &&
    typeof q.author === 'string' && q.author.trim()
  );
}

/**
 * Select a random item from an array
 * @param {Array} items - Array to select from
 * @returns {*} - Random item from array
 */
export function selectRandom(items) {
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

/**
 * Filter quotes by author (case-insensitive exact match)
 * @param {Array} quotes - Array of quote objects
 * @param {string} author - Author name to filter by
 * @returns {Array} - Filtered quotes array
 */
export function filterByAuthor(quotes, author) {
  if (!author) return quotes || [];
  if (!quotes || !Array.isArray(quotes)) return [];
  const needle = author.trim().toLowerCase();
  if (!needle) return [];
  return quotes.filter(q =>
    q && typeof q.author === 'string' &&
    q.author.trim().toLowerCase() === needle
  );
}

/**
 * Load quotes from JSON file (browser version)
 * @param {string} url - URL to fetch quotes from
 * @returns {Promise<Array>} - Promise resolving to quotes array
 */
export async function loadQuotes(url = '/quotes.json') {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load quotes: ${response.status}`);
    }
    const data = await response.json();
    return sanitizeQuotes(data);
  } catch (error) {
    console.error('Error loading quotes:', error);
    throw new Error('Failed to load quotes. Please check your connection.');
  }
}

/**
 * Get a random quote with optional author filtering
 * @param {Object} options - Options object
 * @param {string} options.by - Author to filter by
 * @param {Array} options.quotes - Quotes array to use (optional)
 * @returns {Object} - Result object with ok/value or error
 */
export function getRandomQuote({ by } = {}, { quotes: quotesArray } = {}) {
  // For testing purposes, we'll use a mock quotes array if provided
  let quotes = quotesArray || [];

  if (!quotes || quotes.length === 0) {
    return { ok: false, error: 'No quotes available.' };
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
