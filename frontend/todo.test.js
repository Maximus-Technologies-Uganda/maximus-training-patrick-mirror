import { describe, it, expect } from 'vitest'
import {
  createState,
  addTask,
  getVisibleTasks,
  normalizeTask,
  assertDateOnly,
  DuplicateTaskError,
} from './src/todo-core.js'

describe('To-Do edge cases (table-driven)', () => {
  describe('normalizeTask invalid inputs', () => {
    it.each([
      { title: '', dueDate: '2024-09-18', label: 'empty title' },
      { title: '   ', dueDate: '2024-09-18', label: 'whitespace title' },
    ])('throws on $label', (input) => {
      expect(() => normalizeTask(input)).toThrow('Title is required')
    })

    it.each([
      { title: 'Task', dueDate: '', label: 'empty dueDate' },
      { title: 'Task', dueDate: 'invalid', label: 'invalid dueDate format' },
      { title: 'Task', dueDate: '2024-9-1', label: 'not zero-padded' },
    ])('throws on $label dueDate', (input) => {
      expect(() => normalizeTask(input)).toThrow('dueDate must be YYYY-MM-DD')
    })
  })

  describe('addTask duplicate detection (normalized)', () => {
    it('throws DuplicateTaskError for duplicate normalized title and date', () => {
      let state = createState()
      const due = '2024-09-18'
      state = addTask(state, { title: '  Buy    MILK ', dueDate: due })
      expect(() => addTask(state, { title: 'buy milk', dueDate: due })).toThrow(
        DuplicateTaskError
      )
    })
  })

  describe('getVisibleTasks with unusual filter inputs', () => {
    it('throws when filters is null because destructuring fails', () => {
      let state = createState([
        { title: 'A', dueDate: '2024-09-18', highPriority: false, createdAt: 1 },
      ])
      expect(() => getVisibleTasks(state, /** @type any */(null), new Date('2024-09-18T00:00:00'))).toThrow()
    })

    it.each([
      { filters: /** @type any */({ dueToday: 'nope' }), expected: ['A', 'B'], label: 'non-boolean dueToday coerces to true (string is truthy)' },
      { filters: /** @type any */({ highPriority: 'yes' }), expected: ['B'], label: 'non-boolean highPriority coerces to true' },
      { filters: /** @type any */({ dueToday: 0, highPriority: 1 }), expected: ['B'], label: 'numeric flags: 0 falsy, 1 truthy' },
    ])('handles $label', ({ filters, expected }) => {
      let state = createState([
        { title: 'A', dueDate: '2024-09-18', highPriority: false, createdAt: 1 },
        { title: 'B', dueDate: '2024-09-18', highPriority: true, createdAt: 2 },
      ])
      const tasks = getVisibleTasks(state, filters, new Date('2024-09-18T00:00:00'))
      expect(tasks.map(t => t.title)).toEqual(expected)
    })
  })
})
