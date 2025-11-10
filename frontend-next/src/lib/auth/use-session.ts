"use client";

import { useEffect, useState } from "react";

import {
  clearSession,
  readSession,
  subscribeToSessionChanges,
  writeSession,
  type StoredSession,
} from "./session";

export interface UseSessionResult {
  session: StoredSession | null;
  setSession: (session: StoredSession | null) => void;
  signOut: () => void;
}

/**
 * Fetches session from the server API (reads HttpOnly cookies)
 */
async function fetchSessionFromServer(): Promise<StoredSession | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { userId?: string; role?: string };
    if (!data.userId) {
      return null;
    }

    return {
      userId: data.userId,
      name: data.userId, // Use userId as name fallback
      role: data.role === "admin" ? "admin" : "owner",
    };
  } catch {
    return null;
  }
}

/**
 * Syncs localStorage session with server session (source of truth)
 */
async function syncSessionWithServer(): Promise<StoredSession | null> {
  const serverSession = await fetchSessionFromServer();
  const localStorageSession = readSession();

  // If server has no session but localStorage does, clear localStorage
  if (!serverSession && localStorageSession) {
    clearSession();
    return null;
  }

  // If server has session
  if (serverSession) {
    // Preserve name from localStorage if userId matches, otherwise use userId as name
    const syncedSession: StoredSession = {
      ...serverSession,
      name:
        localStorageSession?.userId === serverSession.userId
          ? localStorageSession.name || serverSession.userId
          : serverSession.userId,
    };

    // If localStorage doesn't exist or differs, update it
    if (
      !localStorageSession ||
      localStorageSession.userId !== syncedSession.userId ||
      localStorageSession.role !== syncedSession.role
    ) {
      writeSession(syncedSession);
    }

    return syncedSession;
  }

  // No server session, return localStorage (might be stale but better than nothing)
  return localStorageSession;
}

export function useSession(): UseSessionResult {
  const [session, setSessionState] = useState<StoredSession | null>(() => {
    // On initial render, use localStorage (will sync with server in useEffect)
    return readSession();
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Sync with server on mount
    setIsLoading(true);
    syncSessionWithServer()
      .then((synced) => {
        if (mounted) {
          setSessionState(synced);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        // Log error but don't break the app - use localStorage session as fallback
        console.error("Failed to sync session on mount:", error);
        if (mounted) {
          setIsLoading(false);
          // Keep existing session from localStorage if sync fails
        }
      });

    // Subscribe to localStorage changes
    const unsubscribe = subscribeToSessionChanges((localStorageSession) => {
      if (mounted) {
        // When localStorage changes, check server to verify
        syncSessionWithServer()
          .then((serverSession) => {
            if (mounted) {
              setSessionState(serverSession || localStorageSession);
            }
          })
          .catch((error) => {
            // Log error but use localStorage session as fallback
            console.error("Failed to sync session on storage change:", error);
            if (mounted) {
              setSessionState(localStorageSession);
            }
          });
      }
    });

    // Periodically sync with server (every 30 seconds)
    const interval = setInterval(() => {
      if (mounted) {
        syncSessionWithServer()
          .then((synced) => {
            if (mounted) {
              setSessionState(synced);
            }
          })
          .catch((error) => {
            // Log error but don't break the app - keep existing session
            console.error("Failed to sync session periodically:", error);
            // Session state remains unchanged on error
          });
      }
    }, 30000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const setSession = (next: StoredSession | null): void => {
    if (next) {
      writeSession(next);
      setSessionState(next);
    } else {
      clearSession();
      setSessionState(null);
    }
  };

  const signOut = (): void => {
    clearSession();
    setSessionState(null);
    // Note: Cookie will be cleared by the logout API endpoint
  };

  return { session: isLoading ? null : session, setSession, signOut };
}
