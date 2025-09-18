import { describe, it, expect } from 'vitest';

describe('debug-storage', () => {
  it('should import and call load function', async () => {
    const { load } = await import('../src/todo-storage.js');
    console.log('load function:', load);
    console.log('typeof load:', typeof load);

    const originalWindow = global.window;
    global.window = undefined;
    const result = load();
    console.log('result:', result);
    console.log('typeof result:', typeof result);
    expect(result).toBeNull();
    global.window = originalWindow;
  });
});
