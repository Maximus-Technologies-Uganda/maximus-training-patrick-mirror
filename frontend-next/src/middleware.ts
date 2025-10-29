import { NextResponse, type NextRequest } from "next/server";
import {
  ensureRequestContext,
  buildPropagationHeaders,
  responseHeadersFromContext,
} from "./middleware/requestId";

/**
 * Next.js middleware that ensures every request has stable tracing headers so
 * downstream route handlers and the API receive consistent identifiers.
 */
export function middleware(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  const context = ensureRequestContext(requestHeaders);

  const propagation = buildPropagationHeaders(context);
  for (const [key, value] of Object.entries(propagation)) {
    requestHeaders.set(key, value);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const responseHeaders = responseHeadersFromContext(context);
  for (const [key, value] of Object.entries(responseHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}
