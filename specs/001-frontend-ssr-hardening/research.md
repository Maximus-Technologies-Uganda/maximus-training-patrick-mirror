# Research Notes – 001 Frontend SSR Hardening

## SSR Performance

- Contentful SSR reduces layout shift; aim p95 TTFB < 300ms local.
- Avoid blocking data waterfalls: batch initial posts fetch.

## SWR Parity

- Canonical key must match server canonical URL to allow hydration reuse.
- Next.js App Router: dynamic = 'force-dynamic' to disable static caching.

## Retry & Backoff

- Full jitter: sleep = rand(0, base \* 2^attempt) capped.
- Target under 3s total: 5 attempts max with cap 800ms.

## Accessibility

- Use role='status' or aria-live='polite' for search result counts.
- Keyboard support for all interactive primitives; focus ring visible (WCAG 2.1 AA).

## Observability

- Inject x-trace-id at edge; propagate to upstream; reflect in logs + /status response.

## OpenAPI & Spectral

- Enforce operationId, 4xx/5xx error schema references, no unnamed paths.

## References

- AWS Architecture Blog: Full Jitter Backoff.
- Next.js docs: Data Fetching & Dynamic Rendering.
- WAI-ARIA Authoring Practices 1.2.
