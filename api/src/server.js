const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { nanoid } = require('nanoid');

// In-memory data store
const postsById = new Map();

// Validation schemas
const postCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  published: z.boolean().optional()
}).strict();

const postUpdateSchema = postCreateSchema.partial().refine((val) => Object.keys(val).length > 0, {
  message: 'At least one field must be provided'
});

// Error helper
function makeError(code, message, details) {
  return { code, message, details };
}

// Express app
const app = express();
app.use(helmet());
app.use(express.json({ limit: '256kb' }));
app.use(morgan('combined'));

// Rate limiting (simple IP based)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Health
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// List posts with simple pagination
app.get('/posts', (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const pageSize = Math.max(Math.min(parseInt(req.query.pageSize || '20', 10) || 20, 100), 1);

  const all = Array.from(postsById.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  const hasNextPage = start + pageSize < all.length;

  res.json({ page, pageSize, hasNextPage, items });
});

// Create post
app.post('/posts', (req, res, next) => {
  const parsed = postCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()))
  }
  const id = nanoid();
  const now = new Date().toISOString();
  const post = {
    id,
    title: parsed.data.title,
    content: parsed.data.content,
    tags: parsed.data.tags || [],
    published: parsed.data.published ?? false,
    createdAt: now,
    updatedAt: now
  };
  postsById.set(id, post);
  res.status(201).location(`/posts/${id}`).json(post);
});

// Read post
app.get('/posts/:id', (req, res, next) => {
  const post = postsById.get(req.params.id);
  if (!post) return next(makeError('not_found', 'Post not found'));
  res.json(post);
});

// Replace post
app.put('/posts/:id', (req, res, next) => {
  const parsed = postCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()))
  }
  const existing = postsById.get(req.params.id);
  if (!existing) return next(makeError('not_found', 'Post not found'));
  const now = new Date().toISOString();
  const updated = {
    id: existing.id,
    title: parsed.data.title,
    content: parsed.data.content,
    tags: parsed.data.tags || [],
    published: parsed.data.published ?? false,
    createdAt: existing.createdAt,
    updatedAt: now
  };
  postsById.set(existing.id, updated);
  res.json(updated);
});

// Patch post
app.patch('/posts/:id', (req, res, next) => {
  const parsed = postUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(makeError('validation_error', 'Invalid request body', parsed.error.flatten()))
  }
  const existing = postsById.get(req.params.id);
  if (!existing) return next(makeError('not_found', 'Post not found'));
  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...parsed.data,
    updatedAt: now
  };
  postsById.set(existing.id, updated);
  res.json(updated);
});

// Delete post
app.delete('/posts/:id', (req, res, next) => {
  const existed = postsById.delete(req.params.id);
  if (!existed) return next(makeError('not_found', 'Post not found'));
  res.status(204).send();
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const statusByCode = {
    validation_error: 400,
    not_found: 404,
    rate_limit_exceeded: 429
  };
  const status = statusByCode[err.code] || 500;
  const body = {
    code: err.code || 'internal_error',
    message: err.message || 'Internal Server Error',
    details: err.details
  };
  res.status(status).json(body);
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

module.exports = { app };


