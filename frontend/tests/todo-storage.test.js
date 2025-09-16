import { describe, it, expect } from 'vitest';
import { load, save } from '../src/todo-storage.js';

describe('todo-storage', () => {
  describe('load', () => {
    it('should return null when window is undefined', () => {
      const originalWindow = global.window;
      global.window = undefined;
      const result = load();
      expect(result).toBeNull();
      global.window = originalWindow;
    });

    it('should return null when localStorage is not available', () => {
      const originalWindow = global.window;
      global.window = {};
      const result = load();
      expect(result).toBeNull();
      global.window = originalWindow;
    });

    it('should return null when localStorage.getItem throws an error', () => {
      const originalWindow = global.window;
      global.window = {
        localStorage: {
          getItem: () => {
            throw new Error('Storage error');
          },
        },
      };
      const result = load();
      expect(result).toBeNull();
      global.window = originalWindow;
    });

    it('should return null when value is null', () => {
      const originalWindow = global.window;
      global.window = {
        localStorage: {
          getItem: () => null,
        },
      };
      const result = load();
      expect(result).toBeNull();
      global.window = originalWindow;
    });

    it('should return null when value is undefined', () => {
      const originalWindow = global.window;
      global.window = {
        localStorage: {
          getItem: () => undefined,
        },
      };
      const result = load();
      expect(result).toBeNull();
      global.window = originalWindow;
    });

    it('should return string value when data exists', () => {
      const originalWindow = global.window;
      const testData = 'test data';
      global.window = {
        localStorage: {
          getItem: () => testData,
        },
      };
      const result = load();
      expect(result).toBe(testData);
      global.window = originalWindow;
    });

    it('should use default key "todos"', () => {
      const originalWindow = global.window;
      let calledWithKey = null;
      global.window = {
        localStorage: {
          getItem: (key) => {
            calledWithKey = key;
            return 'data';
          },
        },
      };
      load();
      expect(calledWithKey).toBe('todos');
      global.window = originalWindow;
    });

    it('should use provided key', () => {
      const originalWindow = global.window;
      let calledWithKey = null;
      global.window = {
        localStorage: {
          getItem: (key) => {
            calledWithKey = key;
            return 'data';
          },
        },
      };
      load('custom-key');
      expect(calledWithKey).toBe('custom-key');
      global.window = originalWindow;
    });
  });

  describe('save', () => {
    it('should do nothing when window is undefined', () => {
      const originalWindow = global.window;
      global.window = undefined;
      expect(() => save('data')).not.toThrow();
      global.window = originalWindow;
    });

    it('should do nothing when localStorage is not available', () => {
      const originalWindow = global.window;
      global.window = {};
      expect(() => save('data')).not.toThrow();
      global.window = originalWindow;
    });

    it('should ignore errors when localStorage.setItem throws', () => {
      const originalWindow = global.window;
      global.window = {
        localStorage: {
          setItem: () => {
            throw new Error('Storage error');
          },
        },
      };
      expect(() => save('data')).not.toThrow();
      global.window = originalWindow;
    });

    it('should save data with default key "todos"', () => {
      const originalWindow = global.window;
      let calledWithKey = null;
      let calledWithValue = null;
      global.window = {
        localStorage: {
          setItem: (key, value) => {
            calledWithKey = key;
            calledWithValue = value;
          },
        },
      };
      save('test data');
      expect(calledWithKey).toBe('todos');
      expect(calledWithValue).toBe('test data');
      global.window = originalWindow;
    });

    it('should save data with provided key', () => {
      const originalWindow = global.window;
      let calledWithKey = null;
      let calledWithValue = null;
      global.window = {
        localStorage: {
          setItem: (key, value) => {
            calledWithKey = key;
            calledWithValue = value;
          },
        },
      };
      save('test data', 'custom-key');
      expect(calledWithKey).toBe('custom-key');
      expect(calledWithValue).toBe('test data');
      global.window = originalWindow;
    });

    it('should convert both key and value to strings', () => {
      const originalWindow = global.window;
      let calledWithKey = null;
      let calledWithValue = null;
      global.window = {
        localStorage: {
          setItem: (key, value) => {
            calledWithKey = key;
            calledWithValue = value;
          },
        },
      };
      save(456, 123);
      expect(calledWithKey).toBe('123');
      expect(calledWithValue).toBe('456');
      global.window = originalWindow;
    });

    it('should handle null and undefined values', () => {
      const originalWindow = global.window;
      let calledWithValue = null;
      global.window = {
        localStorage: {
          setItem: (key, value) => {
            calledWithValue = value;
          },
        },
      };
      save(null);
      expect(calledWithValue).toBe('null');
      
      save(undefined);
      expect(calledWithValue).toBe('undefined');
      global.window = originalWindow;
    });
  });
});