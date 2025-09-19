const { z } = require('zod');

const PostCreate = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  published: z.boolean().optional()
}).strict();

const PostUpdate = PostCreate.partial().refine((val) => Object.keys(val).length > 0, {
  message: 'At least one field must be provided'
});

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

module.exports = { PostCreate, PostUpdate, ListQuery };


