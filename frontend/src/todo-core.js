/**
 * Pure business logic for the To-Do app (no DOM access).
 * State is immutable; all operations return new state objects.
 */

/** @typedef {{
 *   id: number,
 *   title: string,
 *   titleNormalized: string,
 *   dueDate: string, // YYYY-MM-DD in local time
 *   highPriority: boolean,
 *   completed: boolean,
 *   createdAt: number
 * }} Task */

/** @typedef {{ tasks: Task[] }} TodoState */

export class DuplicateTaskError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DuplicateTaskError';
  }
}

/**
 * Create a new empty state or normalize a provided list of tasks.
 * @param {Partial<Task>[]=} initial
 * @returns {TodoState}
 */
export function createState(initial = []) {
  const tasks = initial.map((t, idx) =>
    normalizeTask({
      id: typeof t.id === 'number' ? t.id : idx + 1,
      title: t.title || '',
      dueDate: t.dueDate || formatDateOnly(new Date()),
      highPriority: Boolean(t.highPriority),
      completed: Boolean(t.completed),
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
    })
  );
  return { tasks };
}

/**
 * Normalize/validate a task input into a Task.
 * @param {Partial<Task> & { title: string, dueDate: string }} input
 * @returns {Task}
 */
export function normalizeTask(input) {
  const title = String(input.title || '').trim();
  if (!title) {
    throw new Error('Title is required');
  }
  const dueDate = assertDateOnly(input.dueDate);
  return {
    id: typeof input.id === 'number' ? input.id : 0,
    title,
    titleNormalized: normalizeTitle(title),
    dueDate,
    highPriority: Boolean(input.highPriority),
    completed: Boolean(input.completed),
    createdAt:
      typeof input.createdAt === 'number' ? input.createdAt : Date.now(),
  };
}

/**
 * Add a task to state. Duplicate guard: same normalized title and same due date.
 * @param {TodoState} state
 * @param {{ title: string, dueDate: string, highPriority?: boolean }} input
 * @returns {TodoState}
 */
export function addTask(state, input) {
  const task = normalizeTask({ ...input });
  const isDup = state.tasks.some(
    (t) =>
      t.titleNormalized === task.titleNormalized && t.dueDate === task.dueDate
  );
  if (isDup) {
    throw new DuplicateTaskError('Duplicate task: same title and due date');
  }
  const nextId = computeNextId(state.tasks);
  const created = { ...task, id: nextId };
  return { tasks: [...state.tasks, created] };
}

/**
 * Toggle completion status of a task by id.
 * @param {TodoState} state
 * @param {number} id
 * @returns {TodoState}
 */
export function toggleComplete(state, id) {
  return {
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ),
  };
}

/**
 * Filter tasks by optional flags.
 * - dueToday: only include tasks due today (local) relative to `now`.
 * - highPriority: only include tasks marked as high priority.
 * @param {TodoState} state
 * @param {{ dueToday?: boolean, highPriority?: boolean }} filters
 * @param {Date=} now
 * @returns {Task[]}
 */
export function getVisibleTasks(state, filters = {}, now = new Date()) {
  const { dueToday = false, highPriority = false } = filters;
  const today = formatDateOnly(now);
  return state.tasks
    .filter((t) => (dueToday ? t.dueDate === today : true))
    .filter((t) => (highPriority ? t.highPriority : true))
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Determine if a provided date string is today in local time relative to now.
 * @param {string} dateOnly
 * @param {Date=} now
 */
export function isDateToday(dateOnly, now = new Date()) {
  return assertDateOnly(dateOnly) === formatDateOnly(now);
}

/**
 * Get date-only string for yesterday/today/tomorrow relative to now.
 * @param {'yesterday'|'today'|'tomorrow'} which
 * @param {Date=} now
 */
export function getRelativeDate(which, now = new Date()) {
  const base = new Date(now.getTime());
  if (which === 'yesterday') base.setDate(base.getDate() - 1);
  if (which === 'tomorrow') base.setDate(base.getDate() + 1);
  return formatDateOnly(base);
}

/**
 * Normalize and simplify a title for comparison.
 * @param {string} title
 */
export function normalizeTitle(title) {
  return String(title).trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Ensure the input is a local date-only string YYYY-MM-DD.
 * @param {string} input
 * @returns {string}
 */
export function assertDateOnly(input) {
  const str = String(input || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error('dueDate must be YYYY-MM-DD');
  }
  return str;
}

/**
 * Format a Date to local YYYY-MM-DD.
 * @param {Date} d
 * @returns {string}
 */
export function formatDateOnly(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {Task[]} tasks
 */
function computeNextId(tasks) {
  let maxId = 0;
  for (const t of tasks) {
    if (typeof t.id === 'number' && t.id > maxId) maxId = t.id;
  }
  return maxId + 1;
}

export default {
  createState,
  addTask,
  toggleComplete,
  getVisibleTasks,
  isDateToday,
  getRelativeDate,
  normalizeTitle,
  assertDateOnly,
  formatDateOnly,
  DuplicateTaskError,
};
