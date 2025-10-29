export function getCsrfTokenFromCookie(): string {
  try {
    const cookie = typeof document !== "undefined" ? document.cookie : "";
    const match = cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

export function withCsrf(init?: RequestInit): RequestInit {
  const token = getCsrfTokenFromCookie();
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("X-CSRF-Token", token);
  return { ...(init || {}), headers, credentials: init?.credentials || "include" };
}


