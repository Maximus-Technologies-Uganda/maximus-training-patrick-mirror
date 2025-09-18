import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load, save } from '../src/todo-storage.js';

describe('todo-storage', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  describe('load', () => {
    it('should return null when localStorage is not available', () => {
      // Mock window as undefined (Node.js environment)
      const originalWindow = global.window;
      delete global.window;

      const result = load();
      expect(result).toBeNull();

      // Restore window
      global.window = originalWindow;
    });

    it('should return null when localStorage is not supported', () => {
      // Mock window without localStorage
      const originalWindow = global.window;
      global.window = {};

      const result = load();
      expect(result).toBeNull();

      // Restore window
      global.window = originalWindow;
    });

    it('should return null when getItem returns null', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = load();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('should return null when getItem returns undefined', () => {
      mockLocalStorage.getItem.mockReturnValue(undefined);

      const result = load();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('should return string value when getItem returns valid data', () => {
      const testData = '{"todos": []}';
      mockLocalStorage.getItem.mockReturnValue(testData);

      const result = load();
      expect(result).toBe(testData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('should return null when getItem throws an error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = load();
      expect(result).toBeNull();
    });

    it('should use custom key when provided', () => {
      const testData = '{"custom": []}';
      mockLocalStorage.getItem.mockReturnValue(testData);

      const result = load('custom-key');
      expect(result).toBe(testData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('custom-key');
    });

    it('should convert non-string values to string', () => {
      mockLocalStorage.getItem.mockReturnValue(123);

      const result = load();
      expect(result).toBe('123');
    });
  });

  describe('save', () => {
    it('should do nothing when window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;

      save('test data');
      // Should not throw

      // Restore window
      global.window = originalWindow;
    });

    it('should do nothing when localStorage is not supported', () => {
      const originalWindow = global.window;
      global.window = {};

      save('test data');
      // Should not throw

      // Restore window
      global.window = originalWindow;
    });

    it('should save data to localStorage with default key', () => {
      const testData = '{"todos": []}';

      save(testData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('todos', testData);
    });

    it('should save data to localStorage with custom key', () => {
      const testData = '{"custom": []}';

      save(testData, 'custom-key');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'custom-key',
        testData
      );
    });

    it('should convert non-string values to string', () => {
      const testData = { todos: [] };

      save(testData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'todos',
        '[object Object]'
      );
    });

    it('should handle setItem errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => save('test data')).not.toThrow();
    });

    it('should handle null and undefined values', () => {
      save(null);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('todos', 'null');

      save(undefined);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'todos',
        'undefined'
      );
    });
  });
});
