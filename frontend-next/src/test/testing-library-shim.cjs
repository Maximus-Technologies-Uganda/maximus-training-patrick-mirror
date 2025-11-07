// Re-export the hoisted @testing-library/react dist entry so Vitest and
// tests import a single, shared copy of the testing library and don't
// accidentally load embedded copies that ship inside the package's
// node_modules folder.

const path = require('path');
const { createRequire } = require('module');

const paths = [
  '@testing-library/react',
  path.resolve(__dirname, '..', '..', '..', 'node_modules', '@testing-library/react'),
  path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'node_modules',
    '@testing-library/react',
    'dist',
    'index.js'
  ),
];

const requireForShim = createRequire(__filename);

function isRequireEsmError(error) {
  return Boolean(error && (error.code === 'ERR_REQUIRE_ESM' || /must use import/i.test(error.message)));
}

function resolveModulePath(specifier) {
  try {
    return requireForShim.resolve(specifier);
  } catch (error) {
    console.error(
      `[testing-library-shim] Failed to resolve "${specifier}": ${error && error.message ? error.message : error}`
    );
    return null;
  }
}

function loadEsmWithEsbuild(resolvedPath) {
  const esbuild = requireForShim('esbuild');
  const ModuleCtor = module.constructor;
  const buildResult = esbuild.buildSync({
    entryPoints: [resolvedPath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react-dom', 'react-dom/client'],
    write: false,
    absWorkingDir: path.dirname(resolvedPath),
    target: 'node20',
    logLevel: 'silent',
  });

  if (!buildResult.outputFiles || buildResult.outputFiles.length === 0) {
    throw new Error('esbuild failed to return any output files while transpiling ESM module.');
  }

  const compiledCode = buildResult.outputFiles[0].text;
  const esmModule = new ModuleCtor(resolvedPath, module);
  esmModule.filename = resolvedPath;
  esmModule.paths = ModuleCtor._nodeModulePaths(path.dirname(resolvedPath));
  esmModule._compile(compiledCode, resolvedPath);
  return esmModule.exports;
}

let moduleExports = null;

for (const modulePath of paths) {
  try {
    moduleExports = requireForShim(modulePath);
    break;
  } catch (err) {
    console.error(
      `[testing-library-shim] Failed to require "${modulePath}": ${err && err.message ? err.message : err}`
    );

    if (!isRequireEsmError(err)) {
      continue;
    }

    const resolvedPath = resolveModulePath(modulePath);
    if (!resolvedPath) {
      continue;
    }

    try {
      moduleExports = loadEsmWithEsbuild(resolvedPath);
      break;
    } catch (esmErr) {
      console.error(
        `[testing-library-shim] Failed to transpile ESM module "${resolvedPath}": ${
          esmErr && esmErr.message ? esmErr.message : esmErr
        }`
      );
    }
  }
}

if (!moduleExports) {
  throw new Error(
    'Could not resolve @testing-library/react. Ensure pnpm install has been run and dependencies are installed.'
  );
}

module.exports = moduleExports;
