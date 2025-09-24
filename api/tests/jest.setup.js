// Register jest-openapi matcher globally once, guarded across multiple test environments
(() => {
  if (globalThis.__OPENAPI_JEST_MATCHER_INITIALIZED__) return;
  const openApi = (require('jest-openapi').default || require('jest-openapi'));
  const path = require('path');
  const specPath = path.join(__dirname, '..', '..', 'specs', '002-posts-api', 'contracts', 'openapi.yml');
  try {
    openApi(specPath);
  } catch {
    const jsonPath = path.join(__dirname, '..', 'openapi.json');
    openApi(jsonPath);
  }
  globalThis.__OPENAPI_JEST_MATCHER_INITIALIZED__ = true;
})();
const path = require('path');
const jestOpenAPI = require('jest-openapi').default || require('jest-openapi');

// Register primary OpenAPI document for jest-openapi matchers
const specPath = path.join(__dirname, '..', 'openapi.json');
jestOpenAPI(specPath);


