const assert = require('assert');

function roundtrip(value) {
  const json = JSON.stringify(value);
  const parsed = JSON.parse(json);
  return { json, parsed };
}

(function main() {
  const original = {
    id: 123,
    name: 'Sample',
    flags: [true, false, true],
    meta: { when: new Date('2025-01-01T00:00:00Z').toISOString(), note: 'hello' },
    nil: null
  };

  const { json, parsed } = roundtrip(original);

  //
  assert.strictEqual(typeof json, 'string', 'JSON should be a string');
  assert.strictEqual(parsed.id, original.id, 'id should match');
  assert.strictEqual(parsed.name, original.name, 'name should match');
  assert.deepStrictEqual(parsed.flags, original.flags, 'flags should match');
  assert.strictEqual(parsed.meta.when, original.meta.when, 'meta.when should match');
  assert.strictEqual(parsed.nil, null, 'nil should be null');

  console.log('ok');
})();
