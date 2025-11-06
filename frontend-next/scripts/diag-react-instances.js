const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(__dirname, '..', '..');

function tryResolve(name, paths) {
  try {
    return require.resolve(name, { paths });
  } catch (e) {
    return null;
  }
}

function tryRequire(p) {
  try {
    return { ok: true, exports: require(p) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

console.log('projectRoot:', projectRoot);
console.log('monorepoRoot:', monorepoRoot);

const r1 = tryResolve('react', [projectRoot]);
const r2 = tryResolve('react', [monorepoRoot]);
const rd1 = tryResolve('react-dom', [projectRoot]);
const rd2 = tryResolve('react-dom', [monorepoRoot]);
console.log('resolved react (project):', r1);
console.log('resolved react (monorepo):', r2);
console.log('resolved react-dom (project):', rd1);
console.log('resolved react-dom (monorepo):', rd2);

// Try nested testing-library copies (if present)
const tlibNestedReact = path.resolve(monorepoRoot, 'node_modules', '@testing-library', 'react', 'node_modules', 'react', 'index.js');
const tlibNestedReactDom = path.resolve(monorepoRoot, 'node_modules', '@testing-library', 'react', 'node_modules', 'react-dom', 'cjs', 'react-dom-client.development.js');

console.log('expected nested tlib react path:', tlibNestedReact);
console.log('expected nested tlib react-dom path:', tlibNestedReactDom);

const loaded = {};
if (r1) loaded.r1 = tryRequire(r1);
if (r2) loaded.r2 = tryRequire(r2);
if (rd1) loaded.rd1 = tryRequire(rd1);
if (rd2) loaded.rd2 = tryRequire(rd2);
if (fs.existsSync(tlibNestedReact)) loaded.tlibReact = tryRequire(tlibNestedReact);
else loaded.tlibReact = { ok: false, error: 'not found' };
if (fs.existsSync(tlibNestedReactDom)) loaded.tlibReactDom = tryRequire(tlibNestedReactDom);
else loaded.tlibReactDom = { ok: false, error: 'not found' };

console.log('\nLoaded modules summary:');
for (const k of Object.keys(loaded)) {
  const v = loaded[k];
  if (!v.ok) {
    console.log(k, 'failed to require:', v.error);
    continue;
  }
  const ex = v.exports;
  const keys = ex && typeof ex === 'object' ? Object.keys(ex).slice(0, 20) : typeof ex;
  console.log(k, 'exportsType=', typeof ex, 'keys=', keys.length ? keys : keys);
}

// Identity comparisons (if loaded)
function id(a,b) {
  if (loaded[a] && loaded[a].ok && loaded[b] && loaded[b].ok) {
    try {
      console.log(`${a} === ${b}?`, loaded[a].exports === loaded[b].exports);
    } catch(e) {
      console.log(`${a} === ${b}? (compare failed)`, String(e));
    }
  }
}

id('r1','r2');
id('r1','tlibReact');
id('r2','tlibReact');
id('rd1','rd2');
id('rd1','tlibReactDom');

// Inspect some internals
if (loaded.r1 && loaded.r1.ok) {
  try {
    console.log('\nreact from r1 keys slice:', Object.keys(loaded.r1.exports).slice(0,30));
  } catch(e){}
}

console.log('\nDONE');
