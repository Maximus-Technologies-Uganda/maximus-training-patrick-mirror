import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readSession,
  writeSession,
  clearSession,
  subscribeToSessionChanges,
  type StoredSession,
} from "./session";

const SESSION_STORAGE_KEY = "training:auth:session";

describe("session", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  describe("readSession", () => {
    it("returns null when not in browser", () => {
      // Mock window as undefined
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      const result = readSession();
      expect(result).toBeNull();

      global.window = originalWindow;
    });

    it("returns null when no session in localStorage", () => {
      const result = readSession();
      expect(result).toBeNull();
    });

    it("returns null when session is invalid JSON", () => {
      window.localStorage.setItem(SESSION_STORAGE_KEY, "invalid-json");
      const result = readSession();
      expect(result).toBeNull();
    });

    it("returns null when session doesn't match schema", () => {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ invalid: "data" }));
      const result = readSession();
      expect(result).toBeNull();
    });

    it("returns session when valid", () => {
      const session: StoredSession = {
        userId: "user-123",
        name: "Test User",
        role: "admin",
      };
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      const result = readSession();
      expect(result).toEqual(session);
    });

    it("returns session without role when role is optional", () => {
      const session: StoredSession = {
        userId: "user-123",
        name: "Test User",
      };
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      const result = readSession();
      expect(result).toEqual(session);
    });
  });

  describe("writeSession", () => {
    it("does nothing when not in browser", () => {
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      const session: StoredSession = {
        userId: "user-123",
        name: "Test User",
      };
      writeSession(session);
      // Should not throw

      global.window = originalWindow;
    });

    it("writes session to localStorage", () => {
      const session: StoredSession = {
        userId: "user-123",
        name: "Test User",
        role: "owner",
      };
      writeSession(session);
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      expect(stored).toBe(JSON.stringify(session));
    });
  });

  describe("clearSession", () => {
    it("does nothing when not in browser", () => {
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      clearSession();
      // Should not throw

      global.window = originalWindow;
    });

    it("removes session from localStorage", () => {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ userId: "user-123", name: "Test" })
      );
      clearSession();
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      expect(stored).toBeNull();
    });
  });

  describe("subscribeToSessionChanges", () => {
    it("returns no-op function when not in browser", () => {
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      const unsubscribe = subscribeToSessionChanges(() => {});
      expect(typeof unsubscribe).toBe("function");
      unsubscribe(); // Should not throw

      global.window = originalWindow;
    });

    it("calls callback when storage event fires for session key", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToSessionChanges(callback);

      const session: StoredSession = {
        userId: "user-123",
        name: "Test User",
      };
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

      // Simulate storage event
      const event = new StorageEvent("storage", {
        key: SESSION_STORAGE_KEY,
        newValue: JSON.stringify(session),
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(session);
      unsubscribe();
    });

    it("does not call callback when storage event is for different key", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToSessionChanges(callback);

      const event = new StorageEvent("storage", {
        key: "other-key",
        newValue: "value",
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
      unsubscribe();
    });

    it("unsubscribes correctly", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToSessionChanges(callback);
      unsubscribe();

      const event = new StorageEvent("storage", {
        key: SESSION_STORAGE_KEY,
        newValue: JSON.stringify({ userId: "user-123", name: "Test" }),
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
