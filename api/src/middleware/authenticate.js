function resolveHeaderValue(req, headerName) {
  const header = req.headers[headerName] ?? req.headers[headerName.toLowerCase()];
  if (Array.isArray(header)) {
    const [first] = header;
    return typeof first === 'string' ? first : null;
  }
  return typeof header === 'string' ? header : null;
}

function createHeaderAuthenticationMiddleware(options = {}) {
  const headerName = (options.headerName || 'x-user-id').toLowerCase();

  return function headerAuthentication(req, _res, next) {
    const rawValue = resolveHeaderValue(req, headerName);
    const value = typeof rawValue === 'string' ? rawValue.trim() : '';

    if (value) {
      req.user = { id: value };
    } else if (req.user) {
      delete req.user;
    }

    next();
  };
}

module.exports = { createHeaderAuthenticationMiddleware };
