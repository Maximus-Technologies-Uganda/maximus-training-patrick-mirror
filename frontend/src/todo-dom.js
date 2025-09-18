import {
  add,
  toggle,
  remove,
  filter,
  exportCsv,
  serialize,
  deserialize,
} from './todo-core-v2.js';
import { load, save } from './todo-storage.js';

/**
 * Orchestrates DOM <-> core v2 interactions.
 * - Accessible labels and predictable focus after add/toggle/delete
 * - Filters: text, dueType, priority
 * - CSV export via data URL
 * @param {Document} doc
 * @param {{ idgen?: () => string, clock?: () => Date }} deps
 */
export function initTodoDom(doc = document, deps = {}) {
  // Elements
  const form = doc.querySelector('#add-task-form');
  const inputTitle = doc.querySelector('#task-title');
  const inputDue = doc.querySelector('#task-due');
  const inputPriorityHigh = doc.querySelector('#task-priority');
  const filterText = doc.querySelector('#search-text');
  const filterDueType = doc.querySelector('#filter-due-type');
  const filterPriority = doc.querySelector('#filter-priority');
  const legacyDueToday = doc.querySelector('#filter-due-today');
  const legacyHighPriority = doc.querySelector('#filter-high-priority');
  const exportLink = doc.querySelector('#export-csv');
  const list = doc.querySelector('#task-list');
  const errorBox = doc.querySelector('#error');
  const statusBox = doc.querySelector('#status');

  // Defaults for DI
  const idgen =
    deps.idgen ||
    (() =>
      globalThis.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Math.random().toString(36).slice(2, 9)}`);
  const clock = deps.clock || (() => new Date());

  // Helpers
  function ymd(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Set default due date to today (but allow empty)
  const todayStr = ymd(clock());
  if (inputDue && !inputDue.value) inputDue.value = todayStr;

  /** @type {Array} */
  let state = [];

  /** @type {{ focusTodoId?: string, focusNextAfterId?: string, focusIndex?: number, focusAddField?: boolean, focusListContainer?: boolean }} */
  let focusIntent = {};

  // Load initial state from localStorage
  function loadState() {
    try {
      const raw = load();
      if (raw) {
        const loaded = deserialize(raw);
        if (Array.isArray(loaded)) {
          state = loaded;
        } else {
          showError('Corrupted data detected. Starting with empty list.');
        }
      }
    } catch (err) {
      showError('Failed to load saved data. Starting with empty list.');
    }
  }

  // Save state to localStorage
  function saveState() {
    try {
      const serialized = serialize(state);
      save(serialized);
    } catch (err) {
      // Silently ignore save errors to avoid disrupting user experience
    }
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message || '';
    errorBox.style.display = message ? 'block' : 'none';
  }

  function currentQuery() {
    /** @type {{ text?: string, dueType?: 'today'|'tomorrow'|'overdue'|'all', priority?: 'low'|'med'|'high'|'all' }} */
    const q = {};
    if (filterText && filterText.value) q.text = filterText.value;
    if (filterPriority && filterPriority.value)
      q.priority = filterPriority.value;

    // Back-compat simple toggles take priority over select elements
    if (legacyDueToday && legacyDueToday.checked) {
      q.dueType = 'today';
    } else if (filterDueType && filterDueType.value) {
      q.dueType = filterDueType.value;
    }

    if (legacyHighPriority && legacyHighPriority.checked) {
      q.priority = 'high';
    } else if (filterPriority && filterPriority.value) {
      q.priority = filterPriority.value;
    }
    return q;
  }

  function updateExportCsv() {
    if (!exportLink) return;
    const csv = exportCsv(state);
    const href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    exportLink.setAttribute('href', href);
    if (!exportLink.getAttribute('download'))
      exportLink.setAttribute('download', 'todos.csv');
  }

  // Track if we need to rebuild the entire DOM
  let needsFullRender = true;

  function render() {
    if (!list) return;

    // Ensure list container can be programmatically focused for a11y fallback
    list.setAttribute('tabindex', '-1');

    // If we need a full render (state changes), rebuild everything
    if (needsFullRender) {
      list.innerHTML = '';

      state.forEach((t, idx) => {
        const li = doc.createElement('li');
        li.className = 'task-item';
        if (t.done) li.classList.add('completed');
        li.dataset.taskId = String(t.id);
        li.dataset.priority = t.priority || 'med';
        li.dataset.done = String(t.done);
        li.dataset.due = t.due instanceof Date ? ymd(t.due) : '';
        li.dataset.title = t.title.toLowerCase();

        const cb = doc.createElement('input');
        cb.type = 'checkbox';
        cb.checked = Boolean(t.done);
        cb.className = 'task-toggle';
        cb.id = `todo-toggle-${t.id}`;
        cb.setAttribute('aria-label', `Toggle ${t.title}`);
        cb.addEventListener('change', () => {
          const beforeId = t.id;
          state = toggle(state, t.id);
          saveState();
          // Update the data attribute
          li.dataset.done = String(!t.done);
          if (t.done) {
            li.classList.remove('completed');
          } else {
            li.classList.add('completed');
          }
          // Apply current filter to update visibility
          applyFilters();
          // focus next actionable control
          const visibleItems = Array.from(
            list.querySelectorAll('li.task-item:not(.hidden)')
          );
          const currentIndex = visibleItems.indexOf(li);
          focusIntent = {
            focusIndex: Math.min(currentIndex + 1, visibleItems.length - 1),
          };
          handleFocusIntent();
        });

        const title = doc.createElement('span');
        title.className = 'task-title';
        title.textContent = t.title;
        title.tabIndex = -1; // programmatic focus target

        const meta = doc.createElement('span');
        meta.className = 'task-meta';
        const parts = [];
        if (t.due instanceof Date) parts.push(ymd(t.due));
        parts.push(
          t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Med'
        );
        meta.textContent = `(${parts.join(' · ')})`;

        const del = doc.createElement('button');
        del.type = 'button';
        del.id = `todo-delete-${t.id}`;
        del.className = 'task-delete';
        del.setAttribute('aria-label', `Delete ${t.title}`);
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
          // compute target index for focus after delete
          const visibleItems = Array.from(
            list.querySelectorAll('li.task-item:not(.hidden)')
          );
          const pos = visibleItems.indexOf(li);
          state = remove(state, t.id);
          saveState();
          li.remove(); // Remove from DOM
          // Re-apply filters and update status after deletion
          applyFilters();
          // Next item at same index if exists, else previous, else list container
          const nextVisibleItems = Array.from(
            list.querySelectorAll('li.task-item:not(.hidden)')
          );
          if (nextVisibleItems.length === 0) {
            focusIntent = { focusListContainer: true };
          } else if (pos < nextVisibleItems.length) {
            focusIntent = { focusIndex: pos };
          } else {
            focusIntent = { focusIndex: nextVisibleItems.length - 1 };
          }
          handleFocusIntent();
        });

        li.appendChild(cb);
        li.appendChild(title);
        li.appendChild(meta);
        li.appendChild(del);
        list.appendChild(li);
      });

      needsFullRender = false;
    }

    // Apply current filters to show/hide items
    applyFilters();

    // Update CSV link based on full state (not just filtered)
    updateExportCsv();

    // Handle post-render focus intents
    handleFocusIntent();
  }

  function applyFilters() {
    if (!list) return;
    const q = currentQuery();
    const visible = filter(state, q, { clock });
    const visibleIds = new Set(visible.map((t) => String(t.id)));

    // Show/hide items based on filter
    const items = list.querySelectorAll('li.task-item');
    items.forEach((li) => {
      const taskId = li.dataset.taskId;
      if (visibleIds.has(taskId)) {
        li.classList.remove('hidden');
      } else {
        li.classList.add('hidden');
      }
    });

    // Update live status for screen readers
    if (statusBox) {
      const count = visible.length;
      statusBox.textContent = `${count} ${count === 1 ? 'task' : 'tasks'} showing`;
    }
  }

  function handleFocusIntent() {
    if (focusIntent.focusTodoId) {
      const el = list.querySelector(
        `li[data-task-id="${focusIntent.focusTodoId}"] .task-title`
      );
      if (el && el instanceof HTMLElement) el.focus();
      focusIntent = {};
    } else if (typeof focusIntent.focusIndex === 'number') {
      const visibleItems = Array.from(
        list.querySelectorAll('li.task-item:not(.hidden)')
      );
      const item = visibleItems[focusIntent.focusIndex];
      if (item) {
        const target = item.querySelector('.task-toggle');
        if (target && target instanceof HTMLElement) target.focus();
      }
      focusIntent = {};
    } else if (focusIntent.focusAddField) {
      if (inputTitle && inputTitle instanceof HTMLElement) inputTitle.focus();
      focusIntent = {};
    } else if (focusIntent.focusListContainer) {
      if (list && list instanceof HTMLElement) list.focus();
      focusIntent = {};
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    showError('');
    const title =
      inputTitle && inputTitle.value ? String(inputTitle.value) : '';
    const due =
      inputDue && inputDue.value
        ? new Date(`${inputDue.value}T00:00:00`)
        : undefined;
    const priority =
      inputPriorityHigh && inputPriorityHigh.checked ? 'high' : 'med';
    try {
      const next = add(
        state,
        { title, ...(due ? { due } : {}), priority },
        { idgen, clock }
      );
      state = next;
      saveState();
      if (inputTitle) inputTitle.value = '';
      // After adding, return focus to the title input for quick entry
      focusIntent = { focusAddField: true };
      needsFullRender = true; // Trigger full render for new items
      render();
    } catch (err) {
      if (err && typeof err.message === 'string') {
        showError(err.message);
      } else {
        showError('Could not add task');
      }
    }
  }

  // Events
  form && form.addEventListener('submit', onSubmit);

  const rerender = () => applyFilters();
  filterText && filterText.addEventListener('input', rerender);
  filterDueType && filterDueType.addEventListener('change', rerender);
  filterPriority && filterPriority.addEventListener('change', rerender);
  legacyDueToday && legacyDueToday.addEventListener('change', rerender);
  legacyHighPriority && legacyHighPriority.addEventListener('change', rerender);

  // Load initial state from localStorage
  loadState();

  render();

  return { getState: () => state, render };
}

export default { initTodoDom };
