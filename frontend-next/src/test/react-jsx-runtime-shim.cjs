// Shim for react/jsx-runtime that loads the jsx runtime from the hoisted
// React package and ensures named exports like jsx and jsxDEV are available.
const path = require('path');
const fs = require('fs');
function tryRequire(p) {
  try {
    if (fs.existsSync(p)) return require(p);
  } catch (e) {
    // ignore
  }
  return null;
}

const candidates = [
  path.resolve(__dirname, '..', '..', 'node_modules', 'react', 'jsx-runtime.js'),
  path.resolve(__dirname, '..', '..', '..', 'node_modules', 'react', 'jsx-runtime.js'),
];

let runtime = null;
for (const c of candidates) {
  runtime = tryRequire(c);
  if (runtime) break;
}
if (!runtime) runtime = {};

// Normalize CommonJS default shapes
if (runtime && runtime.default && typeof runtime.default === 'object') {
  runtime = Object.assign({}, runtime.default, runtime);
}

// Ensure expected runtime helpers exist
const helpers = ['jsx', 'jsxDEV', 'jsxs', 'Fragment', 'DEV'];
for (const h of helpers) {
  if (!(h in runtime) && runtime.default && h in runtime.default) runtime[h] = runtime.default[h];
}

// Fallbacks: some builds emit jsxDEV calls in dev transform; if not present,
// fall back to the regular `jsx` implementation so tests still run.
if (runtime) {
  if (typeof runtime.jsxDEV !== 'function' && typeof runtime.jsx === 'function') {
    // eslint-disable-next-line no-console
    console.log('[react-jsx-runtime-shim] adding fallback jsxDEV -> jsx');
    runtime.jsxDEV = runtime.jsx;
  }
  if (typeof runtime.jsxs !== 'function' && typeof runtime.jsx === 'function') {
    runtime.jsxs = runtime.jsx;
  }
  if (!('DEV' in runtime)) {
    runtime.DEV = false;
  }
}

module.exports = runtime;
