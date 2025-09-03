const { validateMonth, getExpenseMonth, filterExpenses, sumExpenses, totalsByCategoryForMonth } = require('../src/core');

describe('expense core utilities', () => {
  test('validateMonth accepts YYYY-MM within range', () => {
    expect(validateMonth('2025-01')).toBe(true);
    expect(validateMonth('1970-12')).toBe(true);
    expect(validateMonth('1969-12')).toBe(false);
    expect(validateMonth('2025-00')).toBe(false);
    expect(validateMonth('2025-13')).toBe(false);
    expect(validateMonth('2025/01')).toBe(false);
  });

  test('getExpenseMonth parses YYYY-MM or YYYY-MM-DD', () => {
    expect(getExpenseMonth({ date: '2025-03' })).toBe('2025-03');
    expect(getExpenseMonth({ date: '2025-03-31' })).toBe('2025-03');
    expect(getExpenseMonth({ date: 'bad' })).toBe(null);
    expect(getExpenseMonth({})).toBe(null);
  });

  test('filterExpenses by month and category', () => {
    const expenses = [
      { id: 1, amount: 10, category: 'a', date: '2025-01-02' },
      { id: 2, amount: 5, category: 'b', date: '2025-01-03' },
      { id: 3, amount: 7, category: 'a', date: '2025-02-01' },
    ];
    expect(filterExpenses(expenses, { month: '2025-01' }).map(e => e.id)).toEqual([1, 2]);
    expect(filterExpenses(expenses, { category: 'a' }).map(e => e.id)).toEqual([1, 3]);
    expect(filterExpenses(expenses, { month: '2025-01', category: 'a' }).map(e => e.id)).toEqual([1]);
  });

  test('sumExpenses handles invalid amounts', () => {
    const expenses = [ { amount: 1 }, { amount: 'x' }, { amount: 2 } ];
    expect(sumExpenses(expenses)).toBe(3);
  });

  test('totalsByCategoryForMonth groups correctly', () => {
    const expenses = [
      { amount: 10, category: 'food', date: '2025-01-01' },
      { amount: 5, category: 'food', date: '2025-01-02' },
      { amount: 2, category: 'transport', date: '2025-01-03' },
      { amount: 1, category: 'food', date: '2025-02-01' },
    ];
    const totals = totalsByCategoryForMonth(expenses, '2025-01');
    expect(totals.food).toBe(15);
    expect(totals.transport).toBe(2);
    expect(totals.uncategorized).toBeUndefined();
  });
});


