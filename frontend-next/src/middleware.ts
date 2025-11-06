import { NextResponse, type NextRequest } from "next/server";
import {
  ensureRequestContext,
  buildPropagationHeaders,
  responseHeadersFromContext,
} from "./middleware/requestId";

/**
 * Next.js middleware that ensures every request has stable tracing headers so
 * downstream route handlers and the API receive consistent identifiers.
 * Also tracks SSR render time via Server-Timing headers.
 */
export function middleware(request: NextRequest): NextResponse {
  const startTime = Date.now();
  const requestHeaders = new Headers(request.headers);
  const context = ensureRequestContext(requestHeaders);

  const propagation = buildPropagationHeaders(context);
  for (const [key, value] of Object.entries(propagation)) {
    requestHeaders.set(key, value);
  }

  // Pass start time to the request so page components can access it
  requestHeaders.set("x-ssr-start-time", String(startTime));

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const responseHeaders = responseHeadersFromContext(context);
  for (const [key, value] of Object.entries(responseHeaders)) {
    response.headers.set(key, value);
  }

  // Add Server-Timing header for SSR performance measurement
  const renderTime = Date.now() - startTime;
  response.headers.set("Server-Timing", `ssr;dur=${renderTime}`);

  return response;
}
