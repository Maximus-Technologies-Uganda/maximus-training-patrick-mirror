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

export function useSession(): UseSessionResult {
  const [session, setSessionState] = useState<StoredSession | null>(() => readSession());

  useEffect(() => {
    const unsubscribe = subscribeToSessionChanges(setSessionState);
    return unsubscribe;
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
  };

  return { session, setSession, signOut };
}
