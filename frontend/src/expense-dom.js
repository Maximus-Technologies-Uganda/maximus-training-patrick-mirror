import {
  formatDate,
  formatAmount,
  getUniqueCategories,
  getExpenseMonth,
  filterExpenses,
  calculateTotal,
} from './expense-core.js';

/**
 * DOM orchestration for the Expense Tracker.
 * Keeps state local and delegates logic to expense-core.
 * @param {Document} doc
 */
export function initExpenseDom(doc = document) {
  const elements = {
    monthFilter: doc.getElementById('month-filter'),
    categoryFilter: doc.getElementById('category-filter'),
    clearFiltersBtn: doc.getElementById('clear-filters'),
    expensesTable: doc.getElementById('expenses-table'),
    expensesBody: doc.getElementById('expenses-body'),
    totalDisplay: doc.getElementById('total-display'),
    totalAmount: doc.getElementById('total-amount'),
    loading: doc.getElementById('loading'),
    errorMessage: doc.getElementById('error-message'),
    noData: doc.getElementById('no-data'),
  };

  /** @type {Array} */
  let allExpenses = [];
  /** @type {Array} */
  let filteredExpenses = [];

  function populateCategoryFilter(categories) {
    const select = elements.categoryFilter;
    if (!select) return;
    while (select.options.length > 1) select.remove(1);
    for (const category of categories) {
      const option = doc.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      select.appendChild(option);
    }
  }

  function renderExpensesTable(expenses) {
    const tbody = elements.expensesBody;
    if (!tbody) return;
    tbody.innerHTML = '';

    if (expenses.length === 0) {
      if (elements.expensesTable) elements.expensesTable.style.display = 'none';
      if (elements.noData) elements.noData.style.display = 'block';
      return;
    }

    if (elements.expensesTable) elements.expensesTable.style.display = 'table';
    if (elements.noData) elements.noData.style.display = 'none';

    for (const expense of expenses) {
      const row = doc.createElement('tr');

      const dateCell = doc.createElement('td');
      dateCell.textContent = formatDate(expense.date);
      row.appendChild(dateCell);

      const categoryCell = doc.createElement('td');
      categoryCell.textContent = expense.category
        ? expense.category.charAt(0).toUpperCase() + expense.category.slice(1)
        : 'Uncategorized';
      categoryCell.className = 'category';
      row.appendChild(categoryCell);

      const descriptionCell = doc.createElement('td');
      descriptionCell.textContent = `Expense #${expense.id}`;
      row.appendChild(descriptionCell);

      const amountCell = doc.createElement('td');
      amountCell.textContent = formatAmount(expense.amount);
      amountCell.className = 'amount';
      row.appendChild(amountCell);

      tbody.appendChild(row);
    }
  }

  function updateTotalDisplay(total) {
    if (elements.totalAmount) elements.totalAmount.textContent = formatAmount(total);
    if (elements.totalDisplay) {
      elements.totalDisplay.style.display = total > 0 ? 'flex' : 'none';
    }
  }

  function showLoading() {
    if (elements.loading) elements.loading.style.display = 'block';
    if (elements.expensesTable) elements.expensesTable.style.display = 'none';
    if (elements.noData) elements.noData.style.display = 'none';
    if (elements.errorMessage) elements.errorMessage.style.display = 'none';
    if (elements.totalDisplay) elements.totalDisplay.style.display = 'none';
  }

  function hideLoading() {
    if (elements.loading) elements.loading.style.display = 'none';
  }

  function showError(message) {
    if (elements.errorMessage) {
      elements.errorMessage.textContent = message;
      elements.errorMessage.style.display = 'block';
    }
    if (elements.expensesTable) elements.expensesTable.style.display = 'none';
    if (elements.noData) elements.noData.style.display = 'none';
    if (elements.totalDisplay) elements.totalDisplay.style.display = 'none';
  }

  function applyFilters() {
    const month = elements.monthFilter ? elements.monthFilter.value : '';
    const category = elements.categoryFilter ? elements.categoryFilter.value : '';
    filteredExpenses = filterExpenses(allExpenses, month, category);
    const total = calculateTotal(filteredExpenses);
    renderExpensesTable(filteredExpenses);
    updateTotalDisplay(total);
  }

  function clearFilters() {
    if (elements.monthFilter) elements.monthFilter.value = '';
    if (elements.categoryFilter) elements.categoryFilter.value = '';
    applyFilters();
  }

  async function initData() {
    try {
      showLoading();
      const response = await fetch('../expense/expenses.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      allExpenses = await response.json();
      populateCategoryFilter(getUniqueCategories(allExpenses));
      applyFilters();
      hideLoading();
    } catch (err) {
      hideLoading();
      const message = err && typeof err.message === 'string' ? err.message : 'Failed to load expense data.';
      showError(message);
    }
  }

  // Events
  elements.monthFilter && elements.monthFilter.addEventListener('change', applyFilters);
  elements.categoryFilter && elements.categoryFilter.addEventListener('change', applyFilters);
  elements.clearFiltersBtn && elements.clearFiltersBtn.addEventListener('click', clearFilters);

  // Kick off
  initData();

  // Expose for testing/hooks
  return {
    getAll: () => allExpenses.slice(),
    getFiltered: () => filteredExpenses.slice(),
    applyFilters,
    clearFilters,
  };
}

export default { initExpenseDom };


