const { validateMonth, getExpenseMonth, filterExpenses, sumExpenses, totalsByCategoryForMonth } = require('../src/core');

describe('expense core: invalid inputs and edge cases', () => {
  test('validateMonth rejects invalid formats and out-of-range months', () => {
    const bad = [undefined, null, 0, {}, [], '2025', '2025/01', '25-01', '2025-00', '2025-13', 'abcd-ef'];
    for (const m of bad) expect(validateMonth(m)).toBe(false);
    const ok = ['1970-01', '2025-12'];
    for (const m of ok) expect(validateMonth(m)).toBe(true);
  });

  test('getExpenseMonth handles edge months and invalid dates', () => {
    expect(getExpenseMonth({ date: '2025-04-30' })).toBe('2025-04'); // 30-day month
    expect(getExpenseMonth({ date: '2025-04-31' })).toBe('2025-04'); // syntactically valid pattern
    expect(getExpenseMonth({ date: '2025-05-31' })).toBe('2025-05'); // 31-day month
    expect(getExpenseMonth({ date: 'bad' })).toBe(null);
    expect(getExpenseMonth({})).toBe(null);
  });

  test('filterExpenses: category only, month only, both, and no flags', () => {
    const expenses = [
      { id: 1, amount: 10, category: 'food', date: '2025-04-01' },
      { id: 2, amount: 5, category: 'travel', date: '2025-04-30' },
      { id: 3, amount: 7, category: 'food', date: '2025-05-01' },
    ];
    // category only
    expect(filterExpenses(expenses, { category: 'food' }).map(e => e.id)).toEqual([1, 3]);
    // month only
    expect(filterExpenses(expenses, { month: '2025-04' }).map(e => e.id)).toEqual([1, 2]);
    // both
    expect(filterExpenses(expenses, { month: '2025-04', category: 'food' }).map(e => e.id)).toEqual([1]);
    // no flags ➜ returns copy of all
    const all = filterExpenses(expenses, {});
    expect(all).toHaveLength(3);
    expect(all).not.toBe(expenses); // should be a copy
  });

  test('sumExpenses and totalsByCategoryForMonth hit error-ish paths', () => {
    const expenses = [
      { amount: 10, category: 'food', date: '2025-04-01' },
      { amount: 'x', category: 'food', date: '2025-04-02' }, // ignored
      { amount: 2, category: null, date: '2025-04-03' },     // uncategorized
      { amount: 1, category: 'misc', date: '2025-05-01' },   // different month
    ];
    expect(sumExpenses(expenses)).toBe(13);

    const totals = totalsByCategoryForMonth(expenses, '2025-04');
    expect(totals.food).toBe(10);
    expect(totals.uncategorized).toBe(2);
    expect(totals.misc).toBeUndefined();
  });
});


