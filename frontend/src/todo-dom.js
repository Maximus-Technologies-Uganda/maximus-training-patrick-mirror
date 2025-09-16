import { add, toggle, remove, filter, exportCsv } from './todo-core-v2.js';

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

  // Defaults for DI
  const idgen = deps.idgen || (() => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 9)}`));
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

  /** @type {{ focusTodoId?: string, focusNextAfterId?: string, focusIndex?: number, focusAddField?: boolean }} */
  let focusIntent = {};

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message || '';
    errorBox.style.display = message ? 'block' : 'none';
  }

  function currentQuery() {
    /** @type {{ text?: string, dueType?: 'today'|'tomorrow'|'overdue'|'all', priority?: 'low'|'med'|'high'|'all' }} */
    const q = {};
    if (filterText && filterText.value) q.text = filterText.value;
    if (filterDueType && filterDueType.value) q.dueType = filterDueType.value;
    if (filterPriority && filterPriority.value) q.priority = filterPriority.value;
    // Back-compat simple toggles
    if (!q.dueType && legacyDueToday && legacyDueToday.checked) q.dueType = 'today';
    if (!q.priority && legacyHighPriority && legacyHighPriority.checked) q.priority = 'high';
    return q;
  }

  function updateExportCsv() {
    if (!exportLink) return;
    const csv = exportCsv(state);
    const href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    exportLink.setAttribute('href', href);
    if (!exportLink.getAttribute('download')) exportLink.setAttribute('download', 'todos.csv');
  }

  function render() {
    if (!list) return;
    const q = currentQuery();
    const visible = filter(state, q);
    list.innerHTML = '';

    visible.forEach((t, idx) => {
      const li = doc.createElement('li');
      li.className = 'task-item';
      if (t.done) li.classList.add('completed');
      li.dataset.taskId = String(t.id);

      const cb = doc.createElement('input');
      cb.type = 'checkbox';
      cb.checked = Boolean(t.done);
      cb.className = 'task-toggle';
      cb.id = `todo-toggle-${t.id}`;
      cb.setAttribute('aria-label', `Toggle ${t.title}`);
      cb.addEventListener('change', () => {
        const beforeId = t.id;
        state = toggle(state, t.id);
        // focus next actionable control
        focusIntent = { focusIndex: Math.min(idx + 1, visible.length - 1) };
        render();
      });

      const title = doc.createElement('span');
      title.className = 'task-title';
      title.textContent = t.title;
      title.tabIndex = -1; // programmatic focus target

      const meta = doc.createElement('span');
      meta.className = 'task-meta';
      const parts = [];
      if (t.due instanceof Date) parts.push(ymd(t.due));
      parts.push(t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Med');
      meta.textContent = `(${parts.join(' · ')})`;

      const del = doc.createElement('button');
      del.type = 'button';
      del.id = `todo-delete-${t.id}`;
      del.className = 'task-delete';
      del.setAttribute('aria-label', `Delete ${t.title}`);
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        // compute target index for focus after delete
        const all = filter(state, q);
        const pos = all.findIndex((x) => x.id === t.id);
        state = remove(state, t.id);
        // Next item at same index if exists, else previous, else add field
        const nextAll = filter(state, q);
        if (nextAll.length === 0) {
          focusIntent = { focusAddField: true };
        } else if (pos < nextAll.length) {
          focusIntent = { focusIndex: pos };
        } else {
          focusIntent = { focusIndex: nextAll.length - 1 };
        }
        render();
      });

      li.appendChild(cb);
      li.appendChild(title);
      li.appendChild(meta);
      li.appendChild(del);
      list.appendChild(li);
    });

    // Update CSV link based on full state (not just filtered)
    updateExportCsv();

    // Handle post-render focus intents
    if (focusIntent.focusTodoId) {
      const el = list.querySelector(`li[data-task-id="${focusIntent.focusTodoId}"] .task-title`);
      if (el && el instanceof HTMLElement) el.focus();
      focusIntent = {};
    } else if (typeof focusIntent.focusIndex === 'number') {
      const item = list.querySelectorAll('li.task-item')[focusIntent.focusIndex];
      if (item) {
        const target = item.querySelector('.task-toggle');
        if (target && target instanceof HTMLElement) target.focus();
      }
      focusIntent = {};
    } else if (focusIntent.focusAddField) {
      if (inputTitle && inputTitle instanceof HTMLElement) inputTitle.focus();
      focusIntent = {};
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    showError('');
    const title = inputTitle && inputTitle.value ? String(inputTitle.value) : '';
    const due = inputDue && inputDue.value ? new Date(`${inputDue.value}T00:00:00`) : undefined;
    const priority = inputPriorityHigh && inputPriorityHigh.checked ? 'high' : 'med';
    try {
      const before = state;
      const next = add(state, { title, ...(due ? { due } : {}), priority }, { idgen, clock });
      const added = next.filter((t) => !before.includes(t));
      state = next;
      if (inputTitle) inputTitle.value = '';
      // Focus the new task's title
      if (added.length > 0) focusIntent = { focusTodoId: String(added[0].id) };
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

  const rerender = () => render();
  filterText && filterText.addEventListener('input', rerender);
  filterDueType && filterDueType.addEventListener('change', rerender);
  filterPriority && filterPriority.addEventListener('change', rerender);
  legacyDueToday && legacyDueToday.addEventListener('change', rerender);
  legacyHighPriority && legacyHighPriority.addEventListener('change', rerender);

  render();

  return { getState: () => state, render };
}

export default { initTodoDom };
