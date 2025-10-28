import { z } from "zod";

const SESSION_STORAGE_KEY = "training:auth:session" as const;

const StoredSessionSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["owner", "admin"]).optional(),
});

export type StoredSession = z.infer<typeof StoredSessionSchema>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readSession(): StoredSession | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = StoredSessionSchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  if (!isBrowser()) return;
  const payload = JSON.stringify(session);
  window.localStorage.setItem(SESSION_STORAGE_KEY, payload);
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function subscribeToSessionChanges(
  callback: (session: StoredSession | null) => void,
): () => void {
  if (!isBrowser()) return () => undefined;

  const handler = (event: StorageEvent): void => {
    if (event.key !== SESSION_STORAGE_KEY) return;
    callback(readSession());
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
