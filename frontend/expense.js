/**
 * Expense Tracker Frontend Logic
 * Handles data fetching, filtering, and UI rendering
 */

// DOM element references
const elements = {
    monthFilter: document.getElementById('month-filter'),
    categoryFilter: document.getElementById('category-filter'),
    clearFiltersBtn: document.getElementById('clear-filters'),
    expensesTable: document.getElementById('expenses-table'),
    expensesBody: document.getElementById('expenses-body'),
    totalDisplay: document.getElementById('total-display'),
    totalAmount: document.getElementById('total-amount'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    noData: document.getElementById('no-data')
};

// Global state
let allExpenses = [];
let filteredExpenses = [];

/**
 * Fetches expense data from the server
 * @returns {Promise<Array>} Array of expense objects
 */
async function fetchExpenses() {
    try {
        const response = await fetch('../expense/expenses.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch expenses:', error);
        throw new Error('Failed to load expense data. Please check your connection and try again.');
    }
}

/**
 * Formats a date string to a more readable format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return dateString;

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Fallback to original string for invalid dates
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString; // Fallback to original string
    }
}

/**
 * Formats amount as currency
 * @param {number} amount - Numeric amount
 * @returns {string} Formatted currency string
 */
function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Extracts unique categories from expenses array
 * @param {Array} expenses - Array of expense objects
 * @returns {Array<string>} Sorted array of unique categories
 */
function getUniqueCategories(expenses) {
    const categories = new Set();
    expenses.forEach(expense => {
        if (expense.category && typeof expense.category === 'string') {
            categories.add(expense.category);
        }
    });
    return Array.from(categories).sort();
}

/**
 * Populates the category filter dropdown with unique categories
 * @param {Array<string>} categories - Array of category names
 */
function populateCategoryFilter(categories) {
    const categoryFilter = elements.categoryFilter;

    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }

    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
    });
}

/**
 * Gets the month from an expense date
 * @param {Object} expense - Expense object
 * @returns {string|null} Month in YYYY-MM format or null
 */
function getExpenseMonth(expense) {
    const date = expense && expense.date;
    if (!date || typeof date !== 'string') return null;

    // Handle YYYY-MM-DD format
    const match = /^(\d{4})-(\d{2})/.exec(date);
    return match ? `${match[1]}-${match[2]}` : null;
}

/**
 * Filters expenses based on current filter values
 * @param {Array} expenses - Array of expense objects
 * @param {string} monthFilter - Month filter value (YYYY-MM)
 * @param {string} categoryFilter - Category filter value
 * @returns {Array} Filtered array of expenses
 */
function filterExpenses(expenses, monthFilter, categoryFilter) {
    return expenses.filter(expense => {
        // Month filter
        if (monthFilter) {
            const expenseMonth = getExpenseMonth(expense);
            if (expenseMonth !== monthFilter) {
                return false;
            }
        }

        // Category filter
        if (categoryFilter) {
            const expenseCategory = expense.category;
            if (!expenseCategory || expenseCategory !== categoryFilter) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Calculates the total amount of expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Total amount
 */
function calculateTotal(expenses) {
    return expenses.reduce((total, expense) => {
        const amount = parseFloat(expense.amount);
        return total + (isNaN(amount) ? 0 : amount);
    }, 0);
}

/**
 * Renders the expenses table
 * @param {Array} expenses - Array of expense objects to render
 */
function renderExpensesTable(expenses) {
    const tbody = elements.expensesBody;
    tbody.innerHTML = '';

    if (expenses.length === 0) {
        elements.expensesTable.style.display = 'none';
        elements.noData.style.display = 'block';
        return;
    }

    elements.expensesTable.style.display = 'table';
    elements.noData.style.display = 'none';

    expenses.forEach(expense => {
        const row = document.createElement('tr');

        // Date cell
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(expense.date);
        row.appendChild(dateCell);

        // Category cell
        const categoryCell = document.createElement('td');
        categoryCell.textContent = expense.category ? expense.category.charAt(0).toUpperCase() + expense.category.slice(1) : 'Uncategorized';
        categoryCell.className = 'category';
        row.appendChild(categoryCell);

        // Description cell (using ID as description for now)
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = `Expense #${expense.id}`;
        row.appendChild(descriptionCell);

        // Amount cell
        const amountCell = document.createElement('td');
        amountCell.textContent = formatAmount(expense.amount);
        amountCell.className = 'amount';
        row.appendChild(amountCell);

        tbody.appendChild(row);
    });
}

/**
 * Updates the total display
 * @param {number} total - Total amount to display
 */
function updateTotalDisplay(total) {
    elements.totalAmount.textContent = formatAmount(total);
    elements.totalDisplay.style.display = total > 0 ? 'flex' : 'none';
}

/**
 * Shows loading state
 */
function showLoading() {
    elements.loading.style.display = 'block';
    elements.expensesTable.style.display = 'none';
    elements.noData.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.totalDisplay.style.display = 'none';
}

/**
 * Hides loading state
 */
function hideLoading() {
    elements.loading.style.display = 'none';
}

/**
 * Shows error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.expensesTable.style.display = 'none';
    elements.noData.style.display = 'none';
    elements.totalDisplay.style.display = 'none';
}

/**
 * Applies current filters and updates the UI
 */
function applyFilters() {
    const monthFilter = elements.monthFilter.value;
    const categoryFilter = elements.categoryFilter.value;

    filteredExpenses = filterExpenses(allExpenses, monthFilter, categoryFilter);
    const total = calculateTotal(filteredExpenses);

    renderExpensesTable(filteredExpenses);
    updateTotalDisplay(total);
}

/**
 * Clears all filters
 */
function clearFilters() {
    elements.monthFilter.value = '';
    elements.categoryFilter.value = '';
    applyFilters();
}

/**
 * Initializes the application
 */
async function init() {
    try {
        showLoading();
        allExpenses = await fetchExpenses();

        // Populate category filter
        const categories = getUniqueCategories(allExpenses);
        populateCategoryFilter(categories);

        // Apply initial filters (show all)
        applyFilters();
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    elements.monthFilter.addEventListener('change', applyFilters);
    elements.categoryFilter.addEventListener('change', applyFilters);
    elements.clearFiltersBtn.addEventListener('click', clearFilters);
}

// Initialize the application when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        init();
    });
}

// Export functions for testing
export {
    formatDate,
    formatAmount,
    getUniqueCategories,
    getExpenseMonth,
    filterExpenses,
    calculateTotal,
    populateCategoryFilter
};