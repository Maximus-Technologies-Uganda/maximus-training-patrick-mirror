import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTodoDom } from '../src/todo-dom.js';

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

describe('todo-dom focus behaviors', () => {
  let doc;

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
    doc = document;
  });

  it('returns focus to #task-title after adding a task', () => {
    const api = initTodoDom(doc, {
      idgen: () => 'id-1',
      clock: () => new Date('2025-01-01T00:00:00'),
    });
    const title = doc.querySelector('#task-title');
    title.value = 'Write docs';
    doc.querySelector('#add-task-form').dispatchEvent(new Event('submit'));
    // Focus should be on title for rapid entry
    expect(document.activeElement).toBe(title);
  });

  it('moves focus to next item (or list) after delete', () => {
    initTodoDom(doc, {
      idgen: (() => {
        let n = 0;
        return () => `id-${++n}`;
      })(),
      clock: () => new Date('2025-01-01T00:00:00'),
    });
    const form = doc.querySelector('#add-task-form');
    const title = doc.querySelector('#task-title');
    title.value = 'A';
    form.dispatchEvent(new Event('submit'));
    title.value = 'B';
    form.dispatchEvent(new Event('submit'));
    // Delete first item
    const firstItem = doc.querySelector('li.task-item');
    firstItem.querySelector('.task-delete').click();
    const visible = Array.from(
      doc.querySelectorAll('li.task-item:not(.hidden)')
    );
    // Focus should land on next remaining item's toggle
    const nextToggle = visible[0].querySelector('.task-toggle');
    expect(document.activeElement).toBe(nextToggle);

    // Now delete the last remaining item: focus should move to the list container
    visible[0].querySelector('.task-delete').click();
    const list = doc.querySelector('#task-list');
    expect(document.activeElement).toBe(list);
  });
});
