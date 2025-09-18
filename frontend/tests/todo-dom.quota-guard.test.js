import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('todo-dom: storage quota guard', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="add-task-form">
        <input id="task-title" />
        <input id="task-due" type="date" />
        <input id="task-priority" type="checkbox" />
        <button type="submit">Add</button>
      </form>
      <div id="error"></div>
      <input id="search-text" />
      <select id="filter-due-type"><option value="all">All</option></select>
      <select id="filter-priority"><option value="all">All</option></select>
      <a id="export-csv"></a>
      <div id="status" role="status" aria-live="polite"></div>
      <ul id="task-list"></ul>`;

    // Mock localStorage with setItem throwing
    const mockLocalStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('Quota exceeded');
      }),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });
  });

  it('surfaces a non-blocking message when save fails due to quota', async () => {
    const { initTodoDom } = await import('../src/todo-dom.js');
    initTodoDom(document, {
      idgen: () => 'id-1',
      clock: () => new Date('2025-01-01T00:00:00'),
    });

    const title = document.querySelector('#task-title');
    title.value = 'Test quota';
    document.querySelector('#add-task-form').dispatchEvent(new Event('submit'));

    const error = document.querySelector('#error');
    expect(error.textContent).toMatch(/storage may be full/i);
    // App should not crash; list may still show the item in-memory
    const items = document.querySelectorAll('li.task-item');
    expect(items.length).toBe(1);
  });
});


