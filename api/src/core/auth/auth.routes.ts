import express from "express";
import { createHmac } from "node:crypto";
import { getSessionSecret } from "../../config";
import { setCacheControlNoStore } from "../../lib/errors";

const router = express.Router();

const isProduction = process.env.NODE_ENV === "production";

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  return Buffer.from(padded, "base64");
}

function signJwt(payload: object, secret: string, expiresInSec: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload } as Record<string, unknown>;
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encPayload}`;
  const signature = createHmac("sha256", secret).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

router.post("/login", async (req, res) => {
  const { username, password, idToken } = (req.body ?? {}) as { username?: string; password?: string; idToken?: string };
  let userId: string | undefined = undefined;

  if (typeof idToken === "string" && idToken.trim()) {
    try {
      // Lazy-load firebase-admin to avoid hard dependency in environments without it
      const admin = (await import("firebase-admin")) as typeof import("firebase-admin");
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      const decoded = await admin.auth().verifyIdToken(idToken, true);
      userId = decoded?.sub;
    } catch {
      const requestId =
        (req as unknown as { requestId?: string }).requestId ||
        ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
      setCacheControlNoStore(res, 401);
      return res.status(401).json({ code: "unauthorized", message: "Unauthorized", ...(requestId ? { requestId } : {}) });
    }
  } else {
    const isValid =
      (username === "admin" && password === "password") ||
      (username === "alice" && password === "correct-password");
    if (isValid) userId = username === "admin" ? "admin-1" : "user-alice-1";
  }

  if (!userId) {
    const requestId =
      (req as unknown as { requestId?: string }).requestId ||
      ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
    console.log(JSON.stringify({ level: "warn", message: "Invalid credentials", requestId }));
    setCacheControlNoStore(res, 401);
    return res.status(401).send();
  }

  const secret = getSessionSecret();
  const token = signJwt({ userId }, secret, 24 * 60 * 60);

  res.cookie("session", token, {
    httpOnly: true,
    secure: isProduction,
    // Use a conservative same-site policy to reduce CSRF risk. If cross-site
    // API access is required in the future, add CSRF protection (e.g. Origin
    // checks and a double-submit token) before changing this value.
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
  // Mint CSRF token cookie for double-submit protection on writes
  const csrf = base64url(Buffer.from(String(Math.random()).slice(2) + Date.now().toString(36)));
  res.cookie("csrf", csrf, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
  });
  const requestId =
    (req as unknown as { requestId?: string }).requestId ||
    ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
  console.log(JSON.stringify({ level: "info", message: "User authenticated successfully", requestId, userId }));
  return res.status(204).send();
});

router.post("/logout", (req, res) => {
  // Idempotent: always clear the session cookie and return 204
  res.cookie("session", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
  });
  res.cookie("csrf", "", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
  });
  const requestId =
    (req as unknown as { requestId?: string }).requestId ||
    ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
  try {
    const secret = getSessionSecret();
    const raw = (req as unknown as { cookies?: Record<string, string> }).cookies?.session ||
      (req.headers.cookie?.match(/(?:^|;)\s*session=([^;]+)/)?.[1] ?? "");
    if (raw) {
      // verify signature minimally to extract userId when valid
      const [h, p, sig] = raw.split(".");
      if (h && p && sig) {
        const data = `${h}.${p}`;
        const expect = createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        if (sig === expect) {
          const payload = JSON.parse(base64urlToBuffer(p).toString("utf8"));
          const userId = typeof payload.userId === "string" ? payload.userId : undefined;
          console.log(JSON.stringify({ level: "info", message: "User logged out", requestId, ...(userId ? { userId } : {}) }));
        } else {
          console.log(JSON.stringify({ level: "info", message: "User logged out", requestId }));
        }
      } else {
        console.log(JSON.stringify({ level: "info", message: "User logged out", requestId }));
      }
    } else {
      console.log(JSON.stringify({ level: "info", message: "User logged out", requestId }));
    }
  } catch {
    console.log(JSON.stringify({ level: "info", message: "User logged out", requestId }));
  }
  return res.status(204).send();
});

export default router;


