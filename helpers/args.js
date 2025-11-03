// Shared argument parsing helpers for CLI apps

function parseArgs(argv) {
  const args = { command: argv[2] || '', rest: argv.slice(3) };
  return args;
}

function parseCommonFlags(tokens) {
  let month = null;
  let category = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] || '';
    if (t === '--') break;
    if (t.startsWith('--month=')) {
      month = t.slice('--month='.length);
    } else if (t === '--month') {
      const v = tokens[++i];
      if (!v || v.startsWith('--')) return { month: '__INVALID__', category };
      month = v;
    } else if (t.startsWith('--category=')) {
      category = t.slice('--category='.length);
    } else if (t === '--category') {
      const v = tokens[++i];
      if (!v || v.startsWith('--')) return { month, category: '__INVALID__' };
      category = v;
    } else if (t.startsWith('-')) {
      return { month: '__INVALID__', category: '__INVALID__' };
    }
  }
  if (typeof category === 'string' && category.trim() === '') {
    category = '__INVALID__';
  }
  return { month, category };
}

function exitWithError(message, code = 1) {
  console.error(message);
  // In test environment, return exit code instead of exiting
  if (process.env.JEST_WORKER_ID) {
    return code;
  }
  process.exit(code);
}

function exitWithSuccess() {
  // In test environment, return success code instead of exiting
  if (process.env.JEST_WORKER_ID) {
    return 0;
  }
  process.exit(0);
}

module.exports = {
  parseArgs,
  parseCommonFlags,
  exitWithError,
  exitWithSuccess,
};
