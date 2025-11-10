import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Unmock use-session so we can test the actual implementation
vi.unmock("./use-session");

import { useSession } from "./use-session";
import * as sessionModule from "./session";
import type { StoredSession } from "./session";

// Mock the session module
vi.mock("./session", () => ({
  readSession: vi.fn(),
  writeSession: vi.fn(),
  clearSession: vi.fn(),
  subscribeToSessionChanges: vi.fn(() => vi.fn()), // Should return an unsubscribe function
}));

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    // Reset subscribeToSessionChanges mock to return an unsubscribe function
    vi.mocked(sessionModule.subscribeToSessionChanges).mockReturnValue(vi.fn());
  });

  it("initializes with session from localStorage", () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
      role: "admin",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(mockSession);

    const { result } = renderHook(() => useSession());
    expect(result.current.session).toEqual(mockSession);
  });

  it("initializes with null when no session", () => {
    vi.mocked(sessionModule.readSession).mockReturnValue(null);

    const { result } = renderHook(() => useSession());
    expect(result.current.session).toBeNull();
  });

  it("subscribes to session changes on mount", () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(sessionModule.readSession).mockReturnValue(null);
    vi.mocked(sessionModule.subscribeToSessionChanges).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useSession());
    expect(sessionModule.subscribeToSessionChanges).toHaveBeenCalled();

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("setSession writes session when provided", () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(null);
    vi.mocked(sessionModule.writeSession).mockImplementation(() => {});

    const { result } = renderHook(() => useSession());

    act(() => {
      result.current.setSession(mockSession);
    });

    expect(sessionModule.writeSession).toHaveBeenCalledWith(mockSession);
    expect(result.current.session).toEqual(mockSession);
  });

  it("setSession clears session when null", () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(mockSession);
    vi.mocked(sessionModule.clearSession).mockImplementation(() => {});

    const { result } = renderHook(() => useSession());

    act(() => {
      result.current.setSession(null);
    });

    expect(sessionModule.clearSession).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it("signOut clears session and sets to null", () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(mockSession);
    vi.mocked(sessionModule.clearSession).mockImplementation(() => {});

    const { result } = renderHook(() => useSession());

    act(() => {
      result.current.signOut();
    });

    expect(sessionModule.clearSession).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it("updates session when storage event fires", async () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
    };
    let storageCallback: ((session: StoredSession | null) => void) | null = null;

    vi.mocked(sessionModule.readSession).mockReturnValue(null);
    vi.mocked(sessionModule.subscribeToSessionChanges).mockImplementation((callback) => {
      storageCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useSession());

    act(() => {
      if (storageCallback) {
        storageCallback(mockSession);
      }
    });

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });
  });
});
