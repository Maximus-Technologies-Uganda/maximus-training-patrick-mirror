import { describe, it, expect } from 'vitest';
import {
    formatDate,
    formatAmount,
    getUniqueCategories,
    getExpenseMonth,
    filterExpenses,
    calculateTotal
} from './src/expense-core.js';

describe('Expense Tracker Frontend', () => {
    describe('formatDate', () => {
        it('should format valid date strings correctly', () => {
            expect(formatDate('2025-01-15')).toBe('Jan 15, 2025');
            expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
        });

        it('should handle invalid date strings gracefully', () => {
            expect(formatDate('invalid-date')).toBe('invalid-date');
            expect(formatDate('')).toBe('');
            expect(formatDate(null)).toBe(null);
        });
    });

    describe('formatAmount', () => {
        it('should format numbers as currency', () => {
            expect(formatAmount(10)).toBe('$10.00');
            expect(formatAmount(15.5)).toBe('$15.50');
            expect(formatAmount(0)).toBe('$0.00');
            expect(formatAmount(-5.25)).toBe('-$5.25');
        });

        it('should handle edge cases', () => {
            expect(formatAmount(NaN)).toBe('$NaN');
            expect(formatAmount(Infinity)).toBe('$∞');
        });
    });

    describe('getUniqueCategories', () => {
        it('should extract and sort unique categories', () => {
            const expenses = [
                { category: 'groceries' },
                { category: 'transport' },
                { category: 'groceries' },
                { category: 'utilities' },
                { category: 'transport' }
            ];

            const result = getUniqueCategories(expenses);
            expect(result).toEqual(['groceries', 'transport', 'utilities']);
        });

        it('should handle expenses without categories', () => {
            const expenses = [
                { category: 'groceries' },
                {},
                { category: null },
                { category: '' }
            ];

            const result = getUniqueCategories(expenses);
            expect(result).toEqual(['groceries']);
        });

        it('should handle empty array', () => {
            expect(getUniqueCategories([])).toEqual([]);
        });
    });

    describe('getExpenseMonth', () => {
        it('should extract month from valid date strings', () => {
            expect(getExpenseMonth({ date: '2025-01-15' })).toBe('2025-01');
            expect(getExpenseMonth({ date: '2024-12-31' })).toBe('2024-12');
            expect(getExpenseMonth({ date: '2023-06-01' })).toBe('2023-06');
        });

        it('should return null for invalid dates', () => {
            expect(getExpenseMonth({ date: 'invalid' })).toBe(null);
            expect(getExpenseMonth({ date: '' })).toBe(null);
            expect(getExpenseMonth({})).toBe(null);
            expect(getExpenseMonth(null)).toBe(null);
        });
    });

    describe('filterExpenses', () => {
        const sampleExpenses = [
            { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
            { id: 2, amount: 15, category: 'transport', date: '2025-01-20' },
            { id: 3, amount: 7.5, category: 'groceries', date: '2025-02-03' },
            { id: 4, amount: 20, category: 'utilities', date: '2025-02-20' },
            { id: 5, amount: 5, category: 'transport', date: '2025-01-30' }
        ];

        it('should return all expenses when no filters are applied', () => {
            const result = filterExpenses(sampleExpenses, '', '');
            expect(result).toEqual(sampleExpenses);
        });

        it('should filter by month correctly', () => {
            const result = filterExpenses(sampleExpenses, '2025-01', '');
            expect(result).toEqual([
                { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                { id: 2, amount: 15, category: 'transport', date: '2025-01-20' },
                { id: 5, amount: 5, category: 'transport', date: '2025-01-30' }
            ]);
        });

        it('should filter by category correctly', () => {
            const result = filterExpenses(sampleExpenses, '', 'groceries');
            expect(result).toEqual([
                { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                { id: 3, amount: 7.5, category: 'groceries', date: '2025-02-03' }
            ]);
        });

        it('should filter by both month and category', () => {
            const result = filterExpenses(sampleExpenses, '2025-01', 'groceries');
            expect(result).toEqual([
                { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' }
            ]);
        });

        it('should handle non-existent filters gracefully', () => {
            const result = filterExpenses(sampleExpenses, '2025-12', '');
            expect(result).toEqual([]);

            const result2 = filterExpenses(sampleExpenses, '', 'nonexistent');
            expect(result2).toEqual([]);
        });

        it('should handle expenses with missing properties', () => {
            const expensesWithMissing = [
                { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                { id: 2, amount: 15 }, // missing category and date
                { id: 3, amount: 7.5, category: 'transport' } // missing date
            ];

            const result = filterExpenses(expensesWithMissing, '2025-01', 'groceries');
            expect(result).toEqual([
                { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' }
            ]);
        });

        // Table-driven tests for empty/no-result scenarios to boost branch/function coverage
        const noResultScenarios = [
            [
                'empty expenses with no filters',
                [],
                '',
                ''
            ],
            [
                'empty expenses with month filter only',
                [],
                '2025-01',
                ''
            ],
            [
                'empty expenses with category filter only',
                [],
                '',
                'groceries'
            ],
            [
                'no match: month filter excludes all entries',
                [
                    { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                    { id: 2, amount: 15, category: 'transport', date: '2025-02-20' }
                ],
                '2025-12',
                ''
            ],
            [
                'no match: category filter excludes all entries',
                [
                    { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                    { id: 2, amount: 15, category: 'transport', date: '2025-02-20' }
                ],
                '',
                'nonexistent'
            ],
            [
                'no match: both filters set, but dates mismatch',
                [
                    { id: 1, amount: 10, category: 'groceries', date: '2025-02-15' },
                    { id: 2, amount: 15, category: 'groceries', date: '2025-02-20' }
                ],
                '2025-01',
                'groceries'
            ],
            [
                'no match: invalid dates cannot satisfy month filter',
                [
                    { id: 1, amount: 10, category: 'groceries', date: 'invalid' },
                    { id: 2, amount: 15, category: 'transport' } // missing date
                ],
                '2025-01',
                ''
            ],
            [
                'no match: missing category cannot satisfy category filter',
                [
                    { id: 1, amount: 10, date: '2025-01-15' }, // missing category
                    { id: 2, amount: 15, category: '', date: '2025-01-20' } // empty category
                ],
                '',
                'groceries'
            ]
        ];

        it.each(noResultScenarios)(
            'should return empty list for %s',
            (_label, expenses, month, category) => {
                const result = filterExpenses(expenses, month, category);
                expect(result).toEqual([]);
            }
        );
    });

    describe('calculateTotal', () => {
        it('should calculate total of valid amounts', () => {
            const expenses = [
                { amount: 10 },
                { amount: 15.5 },
                { amount: 7.25 }
            ];

            expect(calculateTotal(expenses)).toBe(32.75);
        });

        it('should handle invalid amounts gracefully', () => {
            const expenses = [
                { amount: 10 },
                { amount: 'invalid' },
                { amount: null },
                { amount: 15 }
            ];

            expect(calculateTotal(expenses)).toBe(25);
        });

        it('should handle empty array', () => {
            expect(calculateTotal([])).toBe(0);
        });

        it('should handle expenses without amount property', () => {
            const expenses = [
                { category: 'groceries' },
                { amount: 10 }
            ];

            expect(calculateTotal(expenses)).toBe(10);
        });
    });

    describe('Integration tests', () => {
        it('should handle complete expense filtering workflow', () => {
            const expenses = [
                { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                { id: 2, amount: 15, category: 'transport', date: '2025-01-20' },
                { id: 3, amount: 7.5, category: 'groceries', date: '2025-02-03' }
            ];

            // Test filtering by month
            const januaryExpenses = filterExpenses(expenses, '2025-01', '');
            expect(januaryExpenses.length).toBe(2);
            expect(calculateTotal(januaryExpenses)).toBe(25);

            // Test filtering by category
            const groceriesExpenses = filterExpenses(expenses, '', 'groceries');
            expect(groceriesExpenses.length).toBe(2);
            expect(calculateTotal(groceriesExpenses)).toBe(17.5);

            // Test combined filtering
            const januaryGroceries = filterExpenses(expenses, '2025-01', 'groceries');
            expect(januaryGroceries.length).toBe(1);
            expect(calculateTotal(januaryGroceries)).toBe(10);
        });
    });

    describe('applyFilters (DOM integration paths)', () => {
        function makeDoc() {
            const doc = global.document.implementation.createHTMLDocument('Expense');
            doc.body.innerHTML = `
                <select id="month-filter"><option value=""></option></select>
                <select id="category-filter"><option value=""></option></select>
                <button id="clear-filters"></button>
                <table id="expenses-table" style="display:none"><tbody id="expenses-body"></tbody></table>
                <div id="total-display" style="display:none"><span id="total-amount"></span></div>
                <div id="loading" style="display:none"></div>
                <div id="error-message" style="display:none"></div>
                <div id="no-data" style="display:none"></div>
            `;
            return doc;
        }

        it.each([
            [
                'empty expenses with no filters returns empty and hides table',
                [],
                '',
                ''
            ],
            [
                'no match when month excludes all',
                [
                    { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                    { id: 2, amount: 15, category: 'transport', date: '2025-02-20' }
                ],
                '2025-12',
                ''
            ],
            [
                'no match when category excludes all',
                [
                    { id: 1, amount: 10, category: 'groceries', date: '2025-01-15' },
                    { id: 2, amount: 15, category: 'transport', date: '2025-02-20' }
                ],
                '',
                'nonexistent'
            ],
        ])('should handle %s', (_label, expenses, month, category) => {
            const { initExpenseDom } = require('./src/expense-dom.js');
            const doc = makeDoc();
            // stub fetch to return provided expenses
            global.fetch = async () => ({ ok: true, json: async () => expenses });
            const api = initExpenseDom(doc);
            // set filters and apply
            doc.getElementById('month-filter').value = month;
            doc.getElementById('category-filter').value = category;
            api.applyFilters();
            // assertions: body empty, table hidden, no-data visible when no results
            const body = doc.getElementById('expenses-body');
            const table = doc.getElementById('expenses-table');
            const noData = doc.getElementById('no-data');
            expect(body.children.length).toBe(0);
            expect(table.style.display).toBe('none');
            expect(noData.style.display).toBe('block');
        });
    });
});