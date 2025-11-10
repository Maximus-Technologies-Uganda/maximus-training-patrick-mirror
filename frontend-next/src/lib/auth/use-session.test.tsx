import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/test-server";

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
    // Reset MSW handlers
    server.resetHandlers();
  });

  it("initializes with session from localStorage", async () => {
    const mockSession: StoredSession = {
      userId: "user-123",
      name: "Test User",
      role: "admin",
    };
    vi.mocked(sessionModule.readSession).mockReturnValue(mockSession);
    // Set up MSW handler to return the same session (matching userId preserves name from localStorage)
    server.use(
      http.get("/api/auth/me", () => {
        return HttpResponse.json({ userId: mockSession.userId, role: mockSession.role });
      })
    );

    const { result } = renderHook(() => useSession());

    await waitFor(
      () => {
        expect(result.current.session).not.toBeNull();
        expect(result.current.session?.userId).toBe(mockSession.userId);
      },
      { timeout: 3000 }
    );

    // The synced session should preserve the name from localStorage
    expect(result.current.session?.name).toBe(mockSession.name);
    expect(result.current.session?.role).toBe(mockSession.role);
  });

  it("initializes with null when no session", async () => {
    vi.mocked(sessionModule.readSession).mockReturnValue(null);
    // Set up MSW handler to return 401 (no session)
    server.use(
      http.get("/api/auth/me", () => {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      })
    );

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
    vi.mocked(sessionModule.writeSession).mockImplementation(() => {
      // Simulate writeSession actually writing to localStorage
      vi.mocked(sessionModule.readSession).mockReturnValue(mockSession);
    });
    // Set up MSW handler to return the session (server accepts it)
    server.use(
      http.get("/api/auth/me", () => {
        return HttpResponse.json({ userId: mockSession.userId, role: "owner" });
      })
    );

    const { result } = renderHook(() => useSession());

    // Wait for initial sync to complete (should be null)
    await waitFor(
      () => {
        expect(result.current.session).toBeNull();
      },
      { timeout: 3000 }
    );

    act(() => {
      result.current.setSession(mockSession);
    });

    expect(sessionModule.writeSession).toHaveBeenCalledWith(mockSession);
    // After setSession, the session should be set immediately
    // Then server sync will verify it and keep it since server accepts it
    await waitFor(
      () => {
        expect(result.current.session).not.toBeNull();
        expect(result.current.session?.userId).toBe(mockSession.userId);
      },
      { timeout: 3000 }
    );
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
