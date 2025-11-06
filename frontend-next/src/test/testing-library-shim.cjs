// Re-export the hoisted @testing-library/react dist entry so Vitest and
// tests import a single, shared copy of the testing library and don't
// accidentally load embedded copies that ship inside the package's
// node_modules folder.

// Try multiple paths to handle different pnpm hoisting scenarios
const paths = [
  '@testing-library/react',
  '../../../node_modules/@testing-library/react',
  '../../../node_modules/@testing-library/react/dist/index.js',
];

let moduleExports = null;

for (const modulePath of paths) {
  try {
    moduleExports = require(modulePath);
    break;
  } catch (err) {
    // Continue to next path
  }
}

if (!moduleExports) {
  throw new Error(
    'Could not resolve @testing-library/react. Ensure pnpm install has been run and dependencies are installed.'
  );
}

module.exports = moduleExports;
