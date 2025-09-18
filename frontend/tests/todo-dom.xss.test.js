import { describe, it, expect, beforeEach } from 'vitest';
import { initTodoDom } from '../src/todo-dom.js';

describe('todo-dom XSS safety', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="add-task-form">
        <input id="task-title" />
        <input id="task-due" type="date" />
        <input id="task-priority" type="checkbox" />
      </form>
      <div id="error" role="alert" aria-live="polite"></div>
      <input id="search-text" />
      <select id="filter-due-type"><option value="all">All</option></select>
      <select id="filter-priority"><option value="all">All</option></select>
      <a id="export-csv"></a>
      <div id="status" role="status" aria-live="polite"></div>
      <ul id="task-list"></ul>`;
  });

  it('renders script tags as text via textContent', () => {
    const api = initTodoDom(document, {
      idgen: () => 'evil',
      clock: () => new Date('2025-01-01T00:00:00'),
    });
    const form = document.querySelector('#add-task-form');
    const title = document.querySelector('#task-title');
    title.value = "<script>alert('xss')</script>";
    form.dispatchEvent(new Event('submit'));

    const item = document.querySelector('li.task-item');
    const span = item.querySelector('.task-title');
    expect(span.textContent).toBe("<script>alert('xss')</script>");
    // Ensure no script element got inserted
    expect(item.querySelector('script')).toBeNull();
  });
});
