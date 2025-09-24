const path = require('path');
const jestOpenAPI = require('jest-openapi').default || require('jest-openapi');

// Register primary OpenAPI document for jest-openapi matchers
const specPath = path.join(__dirname, '..', 'openapi.json');
jestOpenAPI(specPath);


