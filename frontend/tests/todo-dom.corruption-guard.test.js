import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/todo-storage.js', () => ({
  load: () => '{ this is not valid JSON }',
  save: vi.fn(),
}));

describe('todo-dom: storage corruption guard', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="add-task-form">
        <input id="task-title" />
        <input id="task-due" type="date" />
        <input id="task-priority" type="checkbox" />
      </form>
      <div id="error"></div>
      <input id="search-text" />
      <select id="filter-due-type"><option value="all">All</option></select>
      <select id="filter-priority"><option value="all">All</option></select>
      <a id="export-csv"></a>
      <div id="status" role="status" aria-live="polite"></div>
      <ul id="task-list"></ul>`;
  });

  it('shows user message and starts with empty list when data is corrupted', async () => {
    const { initTodoDom } = await import('../src/todo-dom.js');
    const api = initTodoDom(document, {
      idgen: () => 'id-1',
      clock: () => new Date('2025-01-01T00:00:00'),
    });
    expect(typeof api.render).toBe('function');
    const error = document.querySelector('#error');
    expect(error.textContent).toMatch(/Corrupted data detected/i);
    const items = document.querySelectorAll('li.task-item');
    expect(items.length).toBe(0);
  });
});


