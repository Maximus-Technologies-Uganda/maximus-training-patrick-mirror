// Lightweight auth client with optional Firebase support.
// If Firebase SDK is not available, falls back to BFF endpoints.

type SignInResult = { ok: boolean };

let firebaseApp: unknown | null = null;
let firebaseAuth: null | {
  getAuth: () => import("firebase/auth").Auth;
  signInWithEmailAndPassword: typeof import("firebase/auth").signInWithEmailAndPassword;
  signOut: typeof import("firebase/auth").signOut;
  getIdToken: typeof import("firebase/auth").getIdToken;
} = null;

async function ensureFirebase(): Promise<boolean> {
  if (firebaseAuth) return true;
  try {
    // Dynamic imports so builds work even if Firebase isn't installed locally
    const appMod = await import("firebase/app");
    const authMod = await import("firebase/auth");
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
      firebaseApp = appMod.initializeApp(config);
    }
    firebaseAuth = {
      getAuth: authMod.getAuth,
      signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
      signOut: authMod.signOut,
      getIdToken: authMod.getIdToken,
    };
    return true;
  } catch {
    return false;
  }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && firebaseAuth?.getAuth && firebaseAuth.signInWithEmailAndPassword) {
    const auth = firebaseAuth.getAuth();
    await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
    // Call BFF to establish HttpOnly session and CSRF cookie
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken: await getIdToken(false) }),
    });
    return { ok: res.ok };
  }
  // Fallback: legacy demo username/password to BFF
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: email, password }),
  });
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


