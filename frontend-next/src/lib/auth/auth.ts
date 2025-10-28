// Lightweight auth client with optional Firebase support.
// If Firebase SDK is not available, falls back to BFF endpoints.

import { with429Backoff } from "../http/backoff";

type SignInResult = { ok: boolean };

let firebaseApp: unknown | null = null;
let firebaseAuth: null | {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAuth: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithEmailAndPassword: (...args: unknown[]) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: (...args: unknown[]) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getIdToken: (...args: unknown[]) => Promise<any>;
} = null;
let emulatorConfigured = false;

function connectAuthEmulatorIfNeeded(authMod: Record<string, unknown>): void {
  if (emulatorConfigured) return;
  const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (!host) return;
  const connect = authMod.connectAuthEmulator;
  const getAuth = authMod.getAuth;
  if (typeof connect !== "function" || typeof getAuth !== "function") {
    return;
  }
  const url = host.startsWith("http://") || host.startsWith("https://") ? host : `http://${host}`;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (connect as any)((getAuth as (...args: unknown[]) => unknown)(firebaseApp as unknown), url, {
      disableWarnings: true,
    });
    emulatorConfigured = true;
  } catch {
    // Ignore emulator wiring errors; fallback to production hosts.
  }
}

async function ensureFirebase(): Promise<boolean> {
  if (firebaseAuth) return true;
  try {
    // Dynamic imports so builds work even if Firebase isn't installed locally.
    // Use Function constructor to avoid Vite/esbuild static resolution in test/CI.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const din = new Function('s', 'return import(s)') as (s: string) => Promise<Record<string, unknown>>;
    const appMod = (await din('firebase/app')) as Record<string, unknown>;
    const authMod = (await din('firebase/auth')) as Record<string, unknown>;
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    } as Record<string, string | undefined>;
    if (!firebaseApp) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firebaseApp = (appMod.initializeApp as any)(config);
    }
    connectAuthEmulatorIfNeeded(authMod);
    firebaseAuth = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAuth: authMod.getAuth as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signInWithEmailAndPassword: authMod.signInWithEmailAndPassword as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOut: authMod.signOut as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIdToken: authMod.getIdToken as any,
    };
    return true;
  } catch {
    return false;
  }
}

async function postLogin(body: Record<string, unknown>): Promise<Response> {
  const payload = JSON.stringify(body);
  return with429Backoff(() =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: payload,
    }),
  );
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && firebaseAuth?.getAuth && firebaseAuth.signInWithEmailAndPassword) {
    const auth = firebaseAuth.getAuth();
    await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
    // Call BFF to establish HttpOnly session and CSRF cookie
    const res = await postLogin({ idToken: await getIdToken(false) });
    return { ok: res.ok };
  }
  // Fallback: legacy demo username/password to BFF
  const res = await postLogin({ username: email, password });
  return { ok: res.ok };
}

export async function signOut(): Promise<void> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && firebaseAuth?.getAuth && firebaseAuth.signOut) {
    const auth = firebaseAuth.getAuth();
    try { await firebaseAuth.signOut(auth); } catch {}
  }
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function getIdToken(forceRefresh?: boolean): Promise<string> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && firebaseAuth?.getAuth && firebaseAuth.getIdToken) {
    const user = firebaseAuth.getAuth().currentUser;
    if (user) {
      try {
        return await firebaseAuth.getIdToken(user, !!forceRefresh);
      } catch {
        // ignore and fall through
      }
    }
  }
  return "";
}

export async function fetchWithAuthRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;
  // Single retry with token refresh
  try {
    await getIdToken(true);
  } catch {}
  return fetch(input, init);
}


