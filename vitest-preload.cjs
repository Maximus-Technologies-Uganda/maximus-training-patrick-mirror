const Module = require('module');
const origRequire = Module.prototype.require;
const path = require('path');

// Preload hook to redirect nested @testing-library/react copies of react/react-dom
// to the monorepo-hoisted copies. This runs before Vitest's prebundling so it
// can prevent nested CJS react-dom from being loaded.
try {
  const monorepoRoot = path.resolve(__dirname);
  const hoistedReact = require.resolve(path.join(monorepoRoot, 'node_modules', 'react'));
  const hoistedReactDom = require.resolve(path.join(monorepoRoot, 'node_modules', 'react-dom'));

  Module.prototype.require = function(request) {
    try {
      const resolveFilename = Module._resolveFilename;
      let resolved = null;
      try {
        resolved = resolveFilename(request, this);
      } catch (e) {
        resolved = null;
      }
      if (resolved) {
        const normalized = resolved.replace(/\\/g, '/');
        // If a nested react-dom under @testing-library/react is being required,
        // return the hoisted react-dom instead.
        if (normalized.includes('/node_modules/@testing-library/react/') && normalized.includes('/node_modules/react-dom/')) {
          return origRequire.call(this, hoistedReactDom);
        }
        // If a nested react under @testing-library/react is being required,
        // return the hoisted react instead.
        if (normalized.includes('/node_modules/@testing-library/react/') && normalized.includes('/node_modules/react/')) {
          return origRequire.call(this, hoistedReact);
        }
      }
    } catch (err) {
      // swallow
    }
    return origRequire.call(this, request);
  };
  // eslint-disable-next-line no-console
  console.log('[vitest-preload] module require override installed');
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[vitest-preload] could not install override:', e && e.message ? e.message : e);
}
