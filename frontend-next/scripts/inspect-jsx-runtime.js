const path = require('path');
function safeRequire(p) {
  try { return require(p); } catch (e) { return { error: e.message }; }
}
const shimPath = path.resolve(__dirname, '../src/test/react-jsx-runtime-shim.cjs');
const hoisted = path.resolve(__dirname, '../node_modules/react/jsx-runtime.js');
console.log('shimPath=', shimPath);
console.log('hoisted=', hoisted);
const shim = safeRequire(shimPath);
const hoistedMod = safeRequire(hoisted);
console.log('shim keys=', Object.keys(shim));
console.log('shim.jsx=', typeof shim.jsx, 'shim.jsxDEV=', typeof shim.jsxDEV, 'shim.Fragment=', typeof shim.Fragment);
console.log('hoisted keys=', Object.keys(hoistedMod));
console.log('hoisted.jsx=', typeof hoistedMod.jsx, 'hoisted.jsxDEV=', typeof hoistedMod.jsxDEV, 'hoisted.Fragment=', typeof hoistedMod.Fragment);
