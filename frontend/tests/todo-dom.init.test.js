import { test, expect } from 'vitest';
import { initTodoDom } from '../src/todo-dom.js';

test('todo-dom initializes and sets CSV link', () => {
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
    <ul id="task-list"></ul>`;

  const api = initTodoDom(document, {
    idgen: () => 'id',
    clock: () => new Date('2025-01-01T00:00:00'),
  });
  expect(typeof api.render).toBe('function');
  const a = document.querySelector('#export-csv');
  expect(a).toBeTruthy();
  const href = String(a.getAttribute('href') ?? '');
  expect(href).toMatch(/^data:text\/csv/);
});
