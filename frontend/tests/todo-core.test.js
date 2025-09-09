import {
  createState,
  addTask,
  getRelativeDate,
  isDateToday,
  getVisibleTasks,
  DuplicateTaskError,
} from '../src/todo-core.js';

describe('todo-core', () => {
  describe('date helpers', () => {
    it.each([
      { label: 'yesterday', offset: -1 },
      { label: 'today', offset: 0 },
      { label: 'tomorrow', offset: +1 },
    ])('getRelativeDate $label boundaries', ({ label, offset }) => {
      const base = new Date('2024-09-18T12:00:00');
      const d = getRelativeDate(label, base);
      const expected = new Date(base);
      expected.setDate(expected.getDate() + offset);
      const expStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      expect(d).toBe(expStr);
    });

    it('isDateToday respects local date boundary', () => {
      const base = new Date('2024-09-18T03:04:05');
      const today = getRelativeDate('today', base);
      const yesterday = getRelativeDate('yesterday', base);
      const tomorrow = getRelativeDate('tomorrow', base);
      expect(isDateToday(today, base)).toBe(true);
      expect(isDateToday(yesterday, base)).toBe(false);
      expect(isDateToday(tomorrow, base)).toBe(false);
    });
  });

  describe('addTask and duplicate guard', () => {
    it('adds unique tasks and increments id', () => {
      let state = createState();
      const due = '2024-09-18';
      state = addTask(state, { title: 'Buy milk', dueDate: due });
      state = addTask(state, { title: 'Walk dog', dueDate: due });
      expect(state.tasks.map((t) => t.id)).toEqual([1, 2]);
      expect(state.tasks.map((t) => t.title)).toEqual(['Buy milk', 'Walk dog']);
    });

    it('blocks duplicates by normalized title + dueDate', () => {
      let state = createState();
      const due = '2024-09-18';
      state = addTask(state, { title: '  Buy    MILK ', dueDate: due });
      expect(() => addTask(state, { title: 'buy milk', dueDate: due })).toThrow(
        DuplicateTaskError
      );
    });
  });

  describe('filters', () => {
    it('filters by due today and high priority', () => {
      const base = new Date('2024-09-18T12:00:00');
      const today = getRelativeDate('today', base);
      const tomorrow = getRelativeDate('tomorrow', base);
      let state = createState();
      state = addTask(state, {
        title: 'A',
        dueDate: today,
        highPriority: false,
      });
      state = addTask(state, {
        title: 'B',
        dueDate: today,
        highPriority: true,
      });
      state = addTask(state, {
        title: 'C',
        dueDate: tomorrow,
        highPriority: true,
      });

      const onlyToday = getVisibleTasks(state, { dueToday: true }, base).map(
        (t) => t.title
      );
      expect(onlyToday).toEqual(['A', 'B']);

      const onlyHigh = getVisibleTasks(state, { highPriority: true }, base).map(
        (t) => t.title
      );
      expect(onlyHigh).toEqual(['B', 'C']);

      const both = getVisibleTasks(
        state,
        { dueToday: true, highPriority: true },
        base
      ).map((t) => t.title);
      expect(both).toEqual(['B']);
    });
  });
});
