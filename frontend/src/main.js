// Quote Application Logic
// Reusing core filtering logic from CLI with browser adaptations

import { sanitizeQuotes, selectRandom, filterByAuthor } from './quote-core.js';

/**
 * Display a quote in the UI
 * @param {Object} quote - Quote object with text and author
 */
function displayQuote(quote) {
  const quoteTextElement = document.getElementById('quote-text');
  const quoteAuthorElement = document.getElementById('quote-author');

  if (quote && quote.text && quote.author) {
    quoteTextElement.textContent = `"${quote.text}"`;
    quoteAuthorElement.textContent = `— ${quote.author}`;
  } else {
    quoteTextElement.textContent = '"No quotes available"';
    quoteAuthorElement.textContent = '— System';
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'block';
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'none';
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorElement = document.getElementById('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
  const errorElement = document.getElementById('error');
  errorElement.style.display = 'none';
}

/**
 * Load quotes from JSON file (browser-specific implementation)
 * @returns {Promise<Array>} - Promise resolving to quotes array
 */
async function loadQuotes() {
  try {
    const response = await fetch('/quotes.json');
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
 * Initialize the quote application
 */
async function initQuoteApp() {
  let quotes = [];
  let currentFilteredQuotes = [];

  try {
    showLoading();
    hideError();

    // Load quotes from JSON file
    quotes = await loadQuotes();
    currentFilteredQuotes = [...quotes];

    if (quotes.length === 0) {
      throw new Error('No valid quotes found in the data file.');
    }

    // Display initial random quote
    const randomQuote = selectRandom(quotes);
    displayQuote(randomQuote);
  } catch (error) {
    showError(error.message);
    displayQuote(null);
  } finally {
    hideLoading();
  }

  // Set up search functionality
  const searchButton = document.getElementById('search-button');
  const authorInput = document.getElementById('author-input');

  // Handle search button click
  searchButton.addEventListener('click', () => {
    handleSearch(quotes);
  });

  // Handle Enter key in input field
  authorInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleSearch(quotes);
    }
  });

  /**
   * Handle search functionality
   * @param {Array} allQuotes - All available quotes
   */
  function handleSearch(allQuotes) {
    const authorValue = authorInput.value.trim();

    try {
      hideError();

      if (!authorValue) {
        // No filter - show random from all quotes
        currentFilteredQuotes = [...allQuotes];
        const randomQuote = selectRandom(allQuotes);
        displayQuote(randomQuote);
        return;
      }

      // Filter quotes by author
      const filteredQuotes = filterByAuthor(allQuotes, authorValue);

      if (filteredQuotes.length === 0) {
        showError(
          `No quotes found for author "${authorValue}". Please check the spelling and try again.`
        );
        displayQuote(null);
        return;
      }

      // Display random quote from filtered results
      const randomFilteredQuote = selectRandom(filteredQuotes);
      displayQuote(randomFilteredQuote);

      // Update current filtered quotes for subsequent random selections
      currentFilteredQuotes = filteredQuotes;
    } catch (error) {
      showError('An error occurred while searching. Please try again.');
      console.error('Search error:', error);
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initQuoteApp);
