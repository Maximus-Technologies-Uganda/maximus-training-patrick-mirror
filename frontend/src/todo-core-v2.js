// Core v2: pure, deterministic logic with dependency injection where required

/**
 * Normalize a title for duplicate checks and text filtering.
 * Lowercase, trim, collapse internal whitespace.
 * @param {string} title
 */
export function normalizeTitle(title) {
  return String(title || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Format a Date to local YYYY-MM-DD string.
 * @param {Date} d
 */
function ymd(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date to YYYY-MM-DD string in a specific IANA time zone.
 * Falls back to local if no timeZone provided.
 * @param {Date} d
 * @param {string|undefined} timeZone
 */
function ymdInZone(d, timeZone) {
  if (!timeZone) return ymd(d);
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(d);
    const year =
      parts.find((p) => p.type === 'year')?.value || String(d.getFullYear());
    const month =
      parts.find((p) => p.type === 'month')?.value ||
      String(d.getMonth() + 1).padStart(2, '0');
    const day =
      parts.find((p) => p.type === 'day')?.value ||
      String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (_err) {
    // If the environment doesn't support the timeZone, fall back to local
    return ymd(d);
  }
}

/**
 * Ensure priority is one of low|med|high; default to med.
 * @param {string|undefined} p
 * @returns {'low'|'med'|'high'}
 */
function normalizePriority(p) {
  return p === 'low' || p === 'high' || p === 'med' ? p : 'med';
}

/**
 * Add a new todo immutably.
 * - Validates non-empty title (after trimming)
 * - Rejects duplicates by normalized title
 * - due: if undefined, uses deps.clock(); if null, stays null; if Date, kept
 * - id: uses deps.idgen()
 * @param {Array} state
 * @param {{ title: string, due?: Date|null, priority?: 'low'|'med'|'high' }} input
 * @param {{ idgen: () => string, clock: () => Date }} deps
 */
export function add(state, input, deps) {
  const titleRaw = input?.title ?? '';
  const titleTrimmed = String(titleRaw).trim();
  if (!titleTrimmed) {
    throw new Error('Title is required');
  }

  const normalized = normalizeTitle(titleTrimmed);
  const isDuplicate = state.some((t) => normalizeTitle(t.title) === normalized);
  if (isDuplicate) {
    throw new Error('Duplicate title');
  }

  let dueValue;
  if (Object.prototype.hasOwnProperty.call(input, 'due')) {
    // explicit due provided (could be null)
    dueValue = input.due === null ? null : new Date(input.due);
  } else {
    // due omitted => use clock()
    const now = deps.clock();
    dueValue = new Date(now);
  }

  const todo = {
    id: deps.idgen(),
    title: titleTrimmed,
    due: dueValue,
    priority: normalizePriority(input.priority),
    done: false,
  };

  return [...state, todo];
}

/**
 * Toggle completion by id. Unknown id => no-op (return same reference).
 * @param {Array} state
 * @param {string} id
 */
export function toggle(state, id) {
  let changed = false;
  const next = state.map((t) => {
    if (t.id === id) {
      changed = true;
      return { ...t, done: !t.done };
    }
    return t;
  });
  return changed ? next : state;
}

/**
 * Remove by id. Unknown id => no-op (same reference).
 * @param {Array} state
 * @param {string} id
 */
export function remove(state, id) {
  const idx = state.findIndex((t) => t.id === id);
  if (idx === -1) return state;
  return [...state.slice(0, idx), ...state.slice(idx + 1)];
}

/**
 * Filter by combinable criteria.
 * - text: case/space-insensitive substring match on title
 * - dueType: today|tomorrow|overdue|all (null dues excluded unless all)
 * - priority: low|med|high|all
 * Uses injected clock for date boundaries (or system time as fallback).
 * @param {Array} state
 * @param {{ text?: string, dueType?: 'today'|'tomorrow'|'overdue'|'all', priority?: 'low'|'med'|'high'|'all' }} query
 * @param {{ clock?: () => Date }} deps
 */
export function filter(state, query = {}, deps = {}) {
  const { text, dueType, priority } = query;
  const clock = deps.clock || (() => new Date());
  const timeZone = deps.timeZone;

  const now = clock();
  const today = ymdInZone(now, timeZone);
  const tomorrowDate = new Date(now.getTime());
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = ymdInZone(tomorrowDate, timeZone);

  const textNorm = text ? normalizeTitle(text) : '';
  const priorityNorm = priority && priority !== 'all' ? priority : null;

  function matchesText(t) {
    if (!textNorm) return true;
    return normalizeTitle(t.title).includes(textNorm);
  }

  function matchesDue(t) {
    if (!dueType || dueType === 'all') return true;
    if (t.due == null) return false; // exclude null when filtering by a specific dueType
    const dueYmd = ymdInZone(new Date(t.due), timeZone);
    if (dueType === 'today') return dueYmd === today;
    if (dueType === 'tomorrow') return dueYmd === tomorrow;
    if (dueType === 'overdue') return dueYmd < today;
    return true;
  }

  function matchesPriority(t) {
    if (!priorityNorm) return true;
    return t.priority === priorityNorm;
  }

  return state.filter(matchesText).filter(matchesDue).filter(matchesPriority);
}

/**
 * Export todos to CSV with header and \n newlines.
 * Header: id,title,due,priority,done
 * - due serialized as YYYY-MM-DD or empty when null
 * - quote fields containing commas, quotes, or newlines
 * @param {Array} state
 */
export function exportCsv(state) {
  // Keep header stable and normalized to \n newlines; prefix with UTF-8 BOM for Excel compatibility
  const lines = [['id', 'title', 'due', 'priority', 'done'].join(',')];
  for (const t of state) {
    const row = [
      csvEscape(String(t.id)),
      csvEscape(String(t.title ?? '')),
      csvEscape(t.due instanceof Date ? ymd(t.due) : ''),
      csvEscape(String(t.priority ?? 'med')),
      csvEscape(String(Boolean(t.done))),
    ];
    lines.push(row.join(','));
  }
  return '\uFEFF' + lines.join('\n');
}

function csvEscape(s) {
  const needs = /[",\n\r]/.test(s);
  if (!needs) return s;
  return '"' + s.replace(/"/g, '""') + '"';
}

/**
 * Serialize todos to JSON string, converting Date dues to YYYY-MM-DD strings.
 * @param {Array} state
 */
export function serialize(state) {
  const wire = state.map((t) => ({
    id: t.id,
    title: t.title,
    due: t.due instanceof Date ? ymd(t.due) : null,
    priority: normalizePriority(t.priority),
    done: Boolean(t.done),
  }));
  const envelope = { schemaVersion: 1, data: wire };
  return JSON.stringify(envelope);
}

/**
 * Deserialize from JSON into in-memory todos, converting due strings to Date.
 * Invalid JSON returns an empty list.
 * @param {string} raw
 */
export function deserialize(raw) {
  try {
    const parsed = JSON.parse(String(raw ?? ''));
    // Back-compat: allow array (old schema) or {schemaVersion,data}
    let data = null;
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.data)
    ) {
      const schemaVersion = parsed.schemaVersion;
      if (schemaVersion !== 1) {
        // Future-proofing: unknown versions fallback to reading known shape if possible
      }
      data = parsed.data;
    } else {
      return [];
    }
    return data.map((t) => ({
      id: t.id,
      title: String(t.title ?? ''),
      due: t.due == null ? null : new Date(`${String(t.due)}T00:00:00`),
      priority: normalizePriority(t.priority),
      done: Boolean(t.done),
    }));
  } catch (_err) {
    return [];
  }
}
