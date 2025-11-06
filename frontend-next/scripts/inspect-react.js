const path = require('path');
function safeRequire(p) {
  try {
    return require(p);
  } catch (e) {
    console.error('require failed for', p, e && e.message);
    return null;
  }
}
const realPath = path.resolve(__dirname, '../node_modules/react/index.js');
const shimPath = path.resolve(__dirname, '../src/test/react-shim.cjs');
console.log('realPath=', realPath);
console.log('shimPath=', shimPath);
const real = safeRequire(realPath);
const shim = safeRequire(shimPath);
if (real) {
  console.log('[real] keys', Object.keys(real).slice(0, 50));
  console.log('[real] typeof forwardRef', typeof real.forwardRef);
  console.log('[real] typeof createContext', typeof real.createContext);
  console.log('[real] typeof default', typeof real.default);
  console.log('[real] typeof default.forwardRef', typeof (real.default && real.default.forwardRef));
}
if (shim) {
  console.log('[shim] keys', Object.keys(shim).slice(0, 50));
  console.log('[shim] typeof forwardRef', typeof shim.forwardRef);
  console.log('[shim] typeof createContext', typeof shim.createContext);
  console.log('[shim] typeof default', typeof shim.default);
  console.log('[shim] typeof default.forwardRef', typeof (shim.default && shim.default.forwardRef));
}
