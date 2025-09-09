import {
  createState,
  addTask,
  toggleComplete,
  getVisibleTasks,
  getRelativeDate,
  formatDateOnly,
  DuplicateTaskError,
} from './todo-core.js';

/**
 * Orchestrates DOM <-> core interactions.
 * @param {Document} doc
 * @param {Window} win
 */
export function initTodoDom(doc = document) {
  // Elements
  const form = doc.querySelector('#add-task-form');
  const inputTitle = doc.querySelector('#task-title');
  const inputDue = doc.querySelector('#task-due');
  const inputPriority = doc.querySelector('#task-priority');
  const toggleDueToday = doc.querySelector('#filter-due-today');
  const toggleHighPriority = doc.querySelector('#filter-high-priority');
  const list = doc.querySelector('#task-list');
  const errorBox = doc.querySelector('#error');

  // Set default due date to today
  const today = formatDateOnly(new Date());
  if (inputDue && !inputDue.value) inputDue.value = today;

  /** @type {ReturnType<typeof createState>} */
  let state = createState();

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message || '';
    errorBox.style.display = message ? 'block' : 'none';
  }

  function render() {
    if (!list) return;
    const filters = {
      dueToday: toggleDueToday && toggleDueToday.checked,
      highPriority: toggleHighPriority && toggleHighPriority.checked,
    };
    const items = getVisibleTasks(state, filters);
    list.innerHTML = '';
    for (const task of items) {
      const li = doc.createElement('li');
      li.className = 'task-item';
      li.dataset.taskId = String(task.id);
      const checkbox = doc.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'task-toggle';
      checkbox.addEventListener('change', () => {
        state = toggleComplete(state, task.id);
        render();
      });
      const title = doc.createElement('span');
      title.className = 'task-title';
      title.textContent = task.title;
      const meta = doc.createElement('span');
      meta.className = 'task-meta';
      const parts = [task.dueDate];
      if (task.highPriority) parts.push('High');
      meta.textContent = `(${parts.join(' · ')})`;
      li.appendChild(checkbox);
      li.appendChild(title);
      li.appendChild(meta);
      list.appendChild(li);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    showError('');
    const title = inputTitle && inputTitle.value ? inputTitle.value : '';
    const dueDate =
      inputDue && inputDue.value ? inputDue.value : getRelativeDate('today');
    const highPriority = inputPriority ? Boolean(inputPriority.checked) : false;
    try {
      state = addTask(state, { title, dueDate, highPriority });
      if (inputTitle) inputTitle.value = '';
      render();
    } catch (err) {
      if (err instanceof DuplicateTaskError) {
        showError('That task already exists for this date.');
      } else if (err && typeof err.message === 'string') {
        showError(err.message);
      } else {
        showError('Could not add task');
      }
    }
  }

  form && form.addEventListener('submit', onSubmit);
  toggleDueToday && toggleDueToday.addEventListener('change', render);
  toggleHighPriority && toggleHighPriority.addEventListener('change', render);

  render();

  return { getState: () => state, render };
}

export default { initTodoDom };
