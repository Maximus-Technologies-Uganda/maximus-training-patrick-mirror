/**
 * Pure business logic for the Expense Tracker (no DOM or network access).
 * All functions are stateless and deterministic.
 */

/**
 * Format a YYYY-MM-DD date string as a short, locale-friendly label.
 * Falls back to the original input if it cannot be parsed.
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return dateString;
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a number as a USD currency string.
 * @param {number} amount
 * @returns {string}
 */
export function formatAmount(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Extract unique, sorted categories from a list of expenses.
 * @param {Array<{category?: string}>} expenses
 * @returns {string[]}
 */
export function getUniqueCategories(expenses) {
  const categories = new Set();
  for (const expense of expenses) {
    if (expense && typeof expense.category === 'string' && expense.category) {
      categories.add(expense.category);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Extract YYYY-MM from a YYYY-MM-DD string. Returns null if not parseable.
 * @param {{date?: string}|null} expense
 * @returns {string|null}
 */
export function getExpenseMonth(expense) {
  const date = expense && expense.date;
  if (!date || typeof date !== 'string') return null;
  const match = /^(\d{4})-(\d{2})/.exec(date);
  return match ? `${match[1]}-${match[2]}` : null;
}

/**
 * Filter a list of expenses by an optional month (YYYY-MM) and category.
 * @param {Array<{id:number, amount:number, category?:string, date?:string}>} expenses
 * @param {string} monthFilter
 * @param {string} categoryFilter
 * @returns {Array}
 */
export function filterExpenses(expenses, monthFilter, categoryFilter) {
  return expenses.filter((expense) => {
    if (monthFilter) {
      const expenseMonth = getExpenseMonth(expense);
      if (expenseMonth !== monthFilter) return false;
    }
    if (categoryFilter) {
      const cat = expense && expense.category;
      if (!cat || cat !== categoryFilter) return false;
    }
    return true;
  });
}

/**
 * Sum the numeric amounts of a list of expenses.
 * @param {Array<{amount?: number}>} expenses
 * @returns {number}
 */
export function calculateTotal(expenses) {
  return expenses.reduce((total, expense) => {
    const amount = parseFloat(expense.amount);
    return total + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
}

export default {
  formatDate,
  formatAmount,
  getUniqueCategories,
  getExpenseMonth,
  filterExpenses,
  calculateTotal,
};


