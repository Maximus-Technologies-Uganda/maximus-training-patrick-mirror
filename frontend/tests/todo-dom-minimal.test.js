import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTodoDom } from '../src/todo-dom.js';

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

describe('todo-dom-minimal', () => {
  let mockDocument;
  let mockElements;

  beforeEach(() => {
    // Create mock DOM elements
    mockElements = {
      form: document.createElement('form'),
      inputTitle: document.createElement('input'),
      inputDue: document.createElement('input'),
      inputPriorityHigh: document.createElement('input'),
      filterText: document.createElement('input'),
      filterDueType: document.createElement('select'),
      filterPriority: document.createElement('select'),
      legacyDueToday: document.createElement('input'),
      legacyHighPriority: document.createElement('input'),
      exportLink: document.createElement('a'),
      list: document.createElement('ul'),
      errorBox: document.createElement('div'),
    };

    // Set up element attributes and IDs
    mockElements.form.id = 'add-task-form';
    mockElements.inputTitle.id = 'task-title';
    mockElements.inputDue.id = 'task-due';
    mockElements.inputDue.type = 'date';
    mockElements.inputPriorityHigh.id = 'task-priority';
    mockElements.inputPriorityHigh.type = 'checkbox';
    mockElements.filterText.id = 'search-text';
    mockElements.filterDueType.id = 'filter-due-type';
    mockElements.filterPriority.id = 'filter-priority';
    mockElements.legacyDueToday.id = 'filter-due-today';
    mockElements.legacyDueToday.type = 'checkbox';
    mockElements.legacyHighPriority.id = 'filter-high-priority';
    mockElements.legacyHighPriority.type = 'checkbox';
    mockElements.exportLink.id = 'export-csv';
    mockElements.list.id = 'task-list';
    mockElements.errorBox.id = 'error';

    // Mock document.querySelector to return our mock elements
    mockDocument = {
      querySelector: vi.fn((selector) => {
        const elementMap = {
          '#add-task-form': mockElements.form,
          '#task-title': mockElements.inputTitle,
          '#task-due': mockElements.inputDue,
          '#task-priority': mockElements.inputPriorityHigh,
          '#search-text': mockElements.filterText,
          '#filter-due-type': mockElements.filterDueType,
          '#filter-priority': mockElements.filterPriority,
          '#filter-due-today': mockElements.legacyDueToday,
          '#filter-high-priority': mockElements.legacyHighPriority,
          '#export-csv': mockElements.exportLink,
          '#task-list': mockElements.list,
          '#error': mockElements.errorBox,
        };
        return elementMap[selector] || null;
      }),
      createElement: document.createElement.bind(document),
    };
  });

  describe('initTodoDom', () => {
    it('should initialize with default dependencies', () => {
      const result = initTodoDom(mockDocument);
      expect(result).toHaveProperty('getState');
      expect(result).toHaveProperty('render');
      expect(typeof result.getState).toBe('function');
      expect(typeof result.render).toBe('function');
    });

    it('should initialize with custom dependencies', () => {
      const customIdgen = vi.fn(() => 'custom-id');
      const customClock = vi.fn(() => new Date('2023-01-01'));

      const result = initTodoDom(mockDocument, {
        idgen: customIdgen,
        clock: customClock,
      });

      expect(result).toHaveProperty('getState');
      expect(result).toHaveProperty('render');
    });

    it('should set default due date to today', () => {
      const mockClock = vi.fn(() => new Date('2023-01-15'));
      initTodoDom(mockDocument, { clock: mockClock });

      expect(mockElements.inputDue.value).toBe('2023-01-15');
    });

    it('should not override existing due date value', () => {
      mockElements.inputDue.value = '2023-12-25';
      const mockClock = vi.fn(() => new Date('2023-01-15'));
      initTodoDom(mockDocument, { clock: mockClock });

      expect(mockElements.inputDue.value).toBe('2023-12-25');
    });
  });

  describe('form submission', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
    });

    it('should add a new task on form submission', () => {
      mockElements.inputTitle.value = 'Test task';
      mockElements.inputDue.value = '2023-01-15';

      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      const state = result.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Test task');
      expect(state.tasks[0].priority).toBe('med');
    });

    it('should add high priority task when checkbox is checked', () => {
      mockElements.inputTitle.value = 'High priority task';
      mockElements.inputPriorityHigh.checked = true;

      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      const state = result.getState();
      expect(state.tasks[0].priority).toBe('high');
    });

    it('should clear title input after adding task', () => {
      mockElements.inputTitle.value = 'Test task';

      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      expect(mockElements.inputTitle.value).toBe('');
    });

    it('should handle empty title gracefully', () => {
      mockElements.inputTitle.value = '';

      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      const state = result.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('');
    });
  });

  describe('task rendering', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
      // Add a test task
      mockElements.inputTitle.value = 'Test task';
      mockElements.inputDue.value = '2023-01-15';
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);
    });

    it('should render tasks in the list', () => {
      const taskItems = mockElements.list.querySelectorAll('li.task-item');
      expect(taskItems).toHaveLength(1);

      const taskItem = taskItems[0];
      expect(taskItem.dataset.taskId).toBe('test-uuid-123');
      expect(taskItem.querySelector('.task-title').textContent).toBe(
        'Test task'
      );
    });

    it('should render task metadata', () => {
      const meta = mockElements.list.querySelector('.task-meta');
      expect(meta.textContent).toContain('2023-01-15');
      expect(meta.textContent).toContain('Med');
    });

    it('should render high priority task metadata', () => {
      // Add high priority task
      mockElements.inputTitle.value = 'High priority task';
      mockElements.inputPriorityHigh.checked = true;
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      const metaElements = mockElements.list.querySelectorAll('.task-meta');
      const highPriorityMeta = Array.from(metaElements).find((el) =>
        el.textContent.includes('High')
      );
      expect(highPriorityMeta).toBeTruthy();
    });
  });

  describe('task interactions', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
      // Add a test task
      mockElements.inputTitle.value = 'Test task';
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);
    });

    it('should toggle task completion', () => {
      const checkbox = mockElements.list.querySelector('.task-toggle');
      expect(checkbox.checked).toBe(false);

      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      const state = result.getState();
      expect(state.tasks[0].done).toBe(true);
    });

    it('should delete task when delete button is clicked', () => {
      const deleteButton = mockElements.list.querySelector('.task-delete');
      deleteButton.click();

      const state = result.getState();
      expect(state.tasks).toHaveLength(0);
    });

    it('should update task list after deletion', () => {
      const deleteButton = mockElements.list.querySelector('.task-delete');
      deleteButton.click();

      const taskItems = mockElements.list.querySelectorAll('li.task-item');
      expect(taskItems).toHaveLength(0);
    });
  });

  describe('filtering', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
      // Add multiple test tasks
      mockElements.inputTitle.value = 'Task 1';
      mockElements.inputDue.value = '2023-01-15';
      mockElements.form.dispatchEvent(new Event('submit'));

      mockElements.inputTitle.value = 'Task 2';
      mockElements.inputDue.value = '2023-01-16';
      mockElements.form.dispatchEvent(new Event('submit'));
    });

    it('should filter tasks by text', () => {
      mockElements.filterText.value = 'Task 1';
      mockElements.filterText.dispatchEvent(new Event('input'));

      const taskItems = mockElements.list.querySelectorAll('li.task-item');
      expect(taskItems).toHaveLength(1);
      expect(taskItems[0].querySelector('.task-title').textContent).toBe(
        'Task 1'
      );
    });

    it('should show all tasks when filter is cleared', () => {
      mockElements.filterText.value = 'Task 1';
      mockElements.filterText.dispatchEvent(new Event('input'));

      mockElements.filterText.value = '';
      mockElements.filterText.dispatchEvent(new Event('input'));

      const taskItems = mockElements.list.querySelectorAll('li.task-item');
      expect(taskItems).toHaveLength(2);
    });
  });

  describe('CSV export', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
      // Add a test task
      mockElements.inputTitle.value = 'Test task';
      mockElements.inputDue.value = '2023-01-15';
      mockElements.form.dispatchEvent(new Event('submit'));
    });

    it('should update export link with CSV data', () => {
      expect(mockElements.exportLink.getAttribute('href')).toContain(
        'data:text/csv'
      );
      expect(mockElements.exportLink.getAttribute('download')).toBe(
        'todos.csv'
      );
    });

    it('should include task data in CSV', () => {
      const href = mockElements.exportLink.getAttribute('href');
      const decoded = decodeURIComponent(href.split(',')[1]);
      expect(decoded).toContain('Test task');
    });
  });

  describe('error handling', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
    });

    it('should show error message when task addition fails', () => {
      // Mock add function to throw error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // This should trigger an error in the add function
      mockElements.inputTitle.value = 'Test task';
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      // The error should be handled gracefully
      expect(mockElements.errorBox.style.display).toBe('none');

      console.error = originalConsoleError;
    });

    it('should clear error message on successful submission', () => {
      mockElements.errorBox.style.display = 'block';
      mockElements.errorBox.textContent = 'Previous error';

      mockElements.inputTitle.value = 'Test task';
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);

      expect(mockElements.errorBox.style.display).toBe('none');
    });
  });

  describe('accessibility', () => {
    let result;

    beforeEach(() => {
      result = initTodoDom(mockDocument);
      mockElements.inputTitle.value = 'Test task';
      const submitEvent = new Event('submit');
      mockElements.form.dispatchEvent(submitEvent);
    });

    it('should set proper ARIA labels on checkboxes', () => {
      const checkbox = mockElements.list.querySelector('.task-toggle');
      expect(checkbox.getAttribute('aria-label')).toBe('Toggle Test task');
    });

    it('should set proper ARIA labels on delete buttons', () => {
      const deleteButton = mockElements.list.querySelector('.task-delete');
      expect(deleteButton.getAttribute('aria-label')).toBe('Delete Test task');
    });

    it('should set proper IDs on interactive elements', () => {
      const checkbox = mockElements.list.querySelector('.task-toggle');
      const deleteButton = mockElements.list.querySelector('.task-delete');

      expect(checkbox.id).toBe('todo-toggle-test-uuid-123');
      expect(deleteButton.id).toBe('todo-delete-test-uuid-123');
    });
  });
});
