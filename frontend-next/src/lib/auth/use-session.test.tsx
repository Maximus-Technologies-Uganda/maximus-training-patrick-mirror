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

// Mock fetch for server sync
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    // Reset subscribeToSessionChanges mock to return an unsubscribe function
    vi.mocked(sessionModule.subscribeToSessionChanges).mockReturnValue(vi.fn());
    // Default mock: server returns no session
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);
  });

  it("initializes with session from localStorage", async () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
      role: "admin",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(mockSession);
    // Mock server sync to return the same session
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ userId: mockSession.userId, role: mockSession.role }),
    } as Response);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });
  });

  it("initializes with null when no session", async () => {
    vi.mocked(sessionModule.readSession).mockReturnValue(null);
    // Mock server sync to return null (401)
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });
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

  it("setSession writes session when provided", async () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(null);
    vi.mocked(sessionModule.writeSession).mockImplementation(() => {});
    // Mock server sync to return null initially, then the session after setSession
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ userId: mockSession.userId, role: "owner" }),
    } as Response);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    act(() => {
      result.current.setSession(mockSession);
    });

    expect(sessionModule.writeSession).toHaveBeenCalledWith(mockSession);
    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });
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
