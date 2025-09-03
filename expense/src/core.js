function validateMonth(month) {
  if (typeof month !== 'string') return false;
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return Number.isFinite(y) && y >= 1970 && mo >= 1 && mo <= 12;
}

function getExpenseMonth(expense) {
  const d = expense && expense.date;
  if (!d) return null;
  if (typeof d === 'string') {
    const m1 = /^(\d{4})-(\d{2})$/.exec(d);
    if (m1) return `${m1[1]}-${m1[2]}`;
    const m2 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m2) return `${m2[1]}-${m2[2]}`;
  }
  return null;
}

function filterExpenses(expenses, flags) {
  const { month, category } = flags || {};
  let filtered = Array.isArray(expenses) ? expenses.slice() : [];
  if (month) {
    filtered = filtered.filter((e) => getExpenseMonth(e) === month);
  }
  if (category) {
    filtered = filtered.filter((e) => {
      const c = e && e.category;
      return typeof c === 'string' ? c === category : false;
    });
  }
  return filtered;
}

function sumExpenses(expenses) {
  return (Array.isArray(expenses) ? expenses : []).reduce((acc, e) => {
    const n = Number(e && e.amount);
    return Number.isFinite(n) ? acc + n : acc;
  }, 0);
}

function totalsByCategoryForMonth(expenses, month) {
  const scoped = filterExpenses(expenses, { month });
  const totals = Object.create(null);
  for (const e of scoped) {
    const key = typeof (e && e.category) === 'string' && e.category ? e.category : 'uncategorized';
    const n = Number(e && e.amount);
    if (Number.isFinite(n)) {
      totals[key] = (totals[key] || 0) + n;
    }
  }
  return totals;
}

module.exports = {
  validateMonth,
  getExpenseMonth,
  filterExpenses,
  sumExpenses,
  totalsByCategoryForMonth,
};


