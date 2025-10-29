const express = require('express');

const DEFAULT_CHECKS = {
  firebase: async () => 'ok',
  db: async () => 'ok',
};

function resolveCommitSha(explicit) {
  const candidates = [
    explicit,
    process.env.COMMIT_SHA,
    process.env.GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.SOURCE_VERSION,
  ];
  return (candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || 'local').trim();
}

async function evaluateDependencies(checks) {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, fn]) => {
      try {
        const result = await fn();
        return [name, result];
      } catch (_error) {
        return [name, 'down'];
      }
    }),
  );
  const statuses = {};
  let healthy = true;
  for (const [name, status] of entries) {
    statuses[name] = status;
    if (status === 'down') healthy = false;
  }
  return { statuses, healthy };
}

function createHealthRouter(options = {}) {
  const router = express.Router();
  const dependencyChecks = options.dependencyChecks || DEFAULT_CHECKS;

  router.get('/health', async (_req, res) => {
    const { statuses, healthy } = await evaluateDependencies(dependencyChecks);
    const now = options.now ? options.now() : new Date();
    const uptimeFn = options.uptimeSeconds || process.uptime;
    const uptimeSeconds = uptimeFn();

    const payload = {
      service: options.serviceName || 'api',
      status: healthy ? 'ok' : 'error',
      commit: resolveCommitSha(options.commitSha),
      time: now.toISOString(),
      uptime_s: Math.max(0, Math.round(uptimeSeconds)),
      dependencies: statuses,
    };

    const retryAfterSeconds = Math.max(1, Math.round(options.retryAfterSeconds != null ? options.retryAfterSeconds : 60));

    res.set('Cache-Control', 'no-store');
    res.status(healthy ? 200 : 503);
    if (!healthy) {
      res.set('Retry-After', String(retryAfterSeconds));
    }
    res.type('application/json; charset=utf-8');
    res.json(payload);
  });

  return router;
}

module.exports = { createHealthRouter };
