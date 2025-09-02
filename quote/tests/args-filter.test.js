const { parseArgs, filterQuotesByAuthor } = require('../src/index');

describe('parseArgs', () => {
  test('parses --help', () => {
    const out = parseArgs(['node', 'cli', '--help']);
    expect(out.help).toBe(true);
    expect(out.by).toBe(null);
  });

  test('parses -h', () => {
    const out = parseArgs(['node', 'cli', '-h']);
    expect(out.help).toBe(true);
  });

  test('parses --by value via split flag', () => {
    const out = parseArgs(['node', 'cli', '--by', 'Albert Einstein']);
    expect(out.by).toBe('Albert Einstein');
    expect(out.help).toBe(false);
  });

  test('parses --by=value form', () => {
    const out = parseArgs(['node', 'cli', '--by=Alan Kay']);
    expect(out.by).toBe('Alan Kay');
  });

  test('ignores unknown flags', () => {
    const out = parseArgs(['node', 'cli', '--unknown', '--by=Alan Kay']);
    expect(out.by).toBe('Alan Kay');
    expect(out.help).toBe(false);
  });
});

describe('filterQuotesByAuthor', () => {
  const quotes = [
    { text: 't1', author: 'Albert Einstein' },
    { text: 't2', author: 'Alan Kay' },
    { text: 't3', author: 'BUDDHA' },
    { text: 't4', author: '  Steve Jobs  ' },
    { text: 't5', author: 'John Lennon' },
  ];

  test('returns original array when author falsy', () => {
    expect(filterQuotesByAuthor(quotes, null)).toBe(quotes);
    expect(filterQuotesByAuthor(quotes, undefined)).toBe(quotes);
    expect(filterQuotesByAuthor(quotes, '')).toBe(quotes);
    // Whitespace-only becomes empty needle and the implementation treats it as a filter
    // resulting in an empty array because no author equals empty string after trim.
    expect(filterQuotesByAuthor(quotes, '   ')).toEqual([]);
  });

  test('filters case-insensitively and trims input', () => {
    const byEinstein = filterQuotesByAuthor(quotes, '  albert einstein ');
    expect(byEinstein).toHaveLength(1);
    expect(byEinstein[0].author).toBe('Albert Einstein');
  });

  test('handles quotes with non-string authors by excluding them', () => {
    const mixed = quotes.concat([{ text: 'bad', author: 123 }, { text: 'bad2' }]);
    const res = filterQuotesByAuthor(mixed, 'alan kay');
    expect(res).toHaveLength(1);
    expect(res[0].author).toBe('Alan Kay');
  });

  test('matches authors with surrounding whitespace in data', () => {
    const byJobs = filterQuotesByAuthor(quotes, 'Steve Jobs');
    expect(byJobs).toHaveLength(1);
    expect(byJobs[0].text).toBe('t4');
  });
});


