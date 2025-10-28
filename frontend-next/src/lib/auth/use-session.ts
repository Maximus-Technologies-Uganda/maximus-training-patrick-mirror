"use client";

import { useEffect, useState } from "react";
import { signOut as signOutApi } from "./auth";

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
  signOut: () => Promise<void>;
}

export function useSession(): UseSessionResult {
  const [session, setSessionState] = useState<StoredSession | null>(() => readSession());

  useEffect(() => {
    const unsubscribe = subscribeToSessionChanges(setSessionState);
    return unsubscribe;
  }, []);

  // Attempt to hydrate session from HttpOnly cookies via BFF endpoint
  useEffect(() => {
    let aborted = false;
    async function fetchMe(): Promise<void> {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<StoredSession> & { userId?: string; role?: string; name?: string };
        if (aborted) return;
        if (data && data.userId) {
          const normalized: StoredSession = {
            userId: data.userId,
            name: data.name || data.userId,
            role: (data.role as StoredSession["role"]) || "owner",
          };
          setSessionState(normalized);
        }
      } catch {
        // ignore
      }
    }
    if (!session) fetchMe();
    return () => {
      aborted = true;
    };
  }, [session]);

  const setSession = (next: StoredSession | null): void => {
    if (next) {
      writeSession(next);
      setSessionState(next);
    } else {
      clearSession();
      setSessionState(null);
    }
  };

  const signOut = async (): Promise<void> => {
    try { await signOutApi(); } catch {}
    clearSession();
    setSessionState(null);
  };

  return { session, setSession, signOut };
}
