// Re-export the hoisted @testing-library/react dist entry so Vitest and
// tests import a single, shared copy of the testing library and don't
// accidentally load embedded copies that ship inside the package's
// node_modules folder.
module.exports = require('../../../node_modules/@testing-library/react/dist/index.js');
