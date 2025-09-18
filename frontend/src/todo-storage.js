// LocalStorage adapter with basic resilience
// load(): returns string or null if unavailable or error
// save(raw): stores string, ignores errors

export function load(key = 'todos') {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const value = window.localStorage.getItem(String(key));
    return value == null ? null : String(value);
  } catch (_err) {
    return null;
  }
}

export function save(raw, key = 'todos') {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(String(key), String(raw));
  } catch (_err) {
    // Signal storage issues to the application layer without throwing
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        const evt = new CustomEvent('todo:storage-error', {
          detail: { message: 'Storage quota exceeded or unavailable' },
        });
        window.dispatchEvent(evt);
      }
    } catch (_ignored) {}
  }
}
