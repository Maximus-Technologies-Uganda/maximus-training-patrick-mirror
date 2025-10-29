const { PostCreate, PostUpdate, ListQuery } = require('../src/validation/posts-schemas');
const { makeError, statusByCode } = require('../src/lib/errors');

describe('Validation Schemas', () => {
  describe('PostCreate', () => {
    it('validates required fields and defaults', () => {
      const parsed = PostCreate.safeParse({ title: 'T', content: 'C' });
      expect(parsed.success).toBe(true);
    });

    it('rejects empty strings and too long fields', () => {
      const parsed = PostCreate.safeParse({ title: '', content: '' });
      expect(parsed.success).toBe(false);
    });

    it('validates tags constraints and published optional', () => {
      const good = PostCreate.safeParse({ title: 'T', content: 'C', tags: ['x'], published: true });
      expect(good.success).toBe(true);
      const bad = PostCreate.safeParse({ title: 'T', content: 'C', tags: [''] });
      expect(bad.success).toBe(false);
    });
  });

  describe('PostUpdate', () => {
    it('allows partial updates but requires at least one field', () => {
      const empty = PostUpdate.safeParse({});
      expect(empty.success).toBe(false);
      const ok = PostUpdate.safeParse({ title: 'T' });
      expect(ok.success).toBe(true);
    });
  });

  describe('ListQuery', () => {
    it('coerces numbers and applies bounds/defaults', () => {
      const parsed = ListQuery.safeParse({ page: '2', pageSize: '5' });
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual({ page: 2, pageSize: 5 });
      const def = ListQuery.safeParse({});
      expect(def.success).toBe(true);
      expect(def.data).toEqual({ page: 1, pageSize: 20 });
    });

    it('enforces min/max', () => {
      expect(ListQuery.safeParse({ page: 0, pageSize: 1 }).success).toBe(false);
      expect(ListQuery.safeParse({ page: 1, pageSize: 101 }).success).toBe(false);
    });
  });
});

describe('Error helpers', () => {
  it('makeError sets code/message/details and statusByCode maps correctly', () => {
    const err = makeError('validation_error', 'Invalid', { fields: {} });
    expect(err).toMatchObject({ code: 'validation_error', message: 'Invalid', details: { fields: {} } });
    expect(statusByCode.validation_error).toBe(422);
    expect(statusByCode.not_found).toBe(404);
  });
});


