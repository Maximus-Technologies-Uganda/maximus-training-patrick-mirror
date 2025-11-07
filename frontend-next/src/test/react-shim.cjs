// CommonJS shim that normalizes the React module shape for the test runtime.
// Use require.resolve to find the exact react entry file and then require it.
const path = require('path');
const fs = require('fs');

function safeRequireResolved(name) {
  try {
    const resolved = require.resolve(name);
    return require(resolved);
  } catch (e) {
    // fallback to plain require
    try {
      return require(name);
    } catch (e2) {
      return null;
    }
  }
}

// Prefer the project-local react first, then workspace root. This mirrors the
// resolution logic used in the test setup override.
let real = null;
try {
  // Attempt to resolve using project-local paths provided by Node's resolver.
  const projectLocal = path.resolve(__dirname, '..', '..', 'node_modules', 'react');
  real = safeRequireResolved(projectLocal) || safeRequireResolved('react');
} catch (e) {
  real = safeRequireResolved('react');
}
real = real || {};

// Build normalized namespace object.
const normalized = {};

// Copy enumerable properties from real onto normalized.
if (real && typeof real === 'object') {
  Object.keys(real).forEach((k) => {
    normalized[k] = real[k];
  });
}

// If the real module has a `.default` namespace (CJS interop), merge that too,
// preferring functions from the underlying default if present.
if (real && real.default && typeof real.default === 'object') {
  Object.keys(real.default).forEach((k) => {
    if (!(k in normalized) || typeof normalized[k] === 'undefined') normalized[k] = real.default[k];
  });
}

// Ensure default is the normalized namespace (so code that reads React.default.<x>
// gets the expected functions).
normalized.default = normalized;

// Ensure key React APIs exist on both the top-level and default namespace.
const names = [
  'createElement',
  'createContext',
  'forwardRef',
  'Fragment',
  'isValidElement',
  'useState',
  'useEffect',
  'useRef',
  'useContext',
  'Children',
  'Component',
  'PureComponent',
];

for (const n of names) {
  const val = normalized[n];
  if (typeof val === 'function') {
    // copy into default as well (idempotent)
    normalized.default[n] = val;
  } else if (normalized.default && typeof normalized.default[n] === 'function') {
    normalized[n] = normalized.default[n];
  } else {
    // leave undefined if not present; tests will surface the error if truly missing
    normalized[n] = normalized[n] || undefined;
  }
}

// Minimal diagnostic to help triage remaining cases: print whether forwardRef/createContext are functions.
try {
   
  console.log(`[react-shim] forwardRef=${typeof normalized.forwardRef}, createContext=${typeof normalized.createContext}`);
} catch (e) {
  // ignore logging errors
}

module.exports = normalized;
 
