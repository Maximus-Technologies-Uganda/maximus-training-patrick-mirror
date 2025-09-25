# Research: Frontend Consumes Posts API

## Decisions
- Fetch Strategy: Client-side SWR
- Deployment: GitHub Pages (Static Export)

## Rationale
- SWR provides built-in caching, revalidation, error/loading states, and `mutate` for instant UI updates after create; aligns with Acceptance Scenarios 1, 3, and 4.
- Static export avoids server runtime and complexity; meets FR-010 and the Deployment Rationale; API is external and accessible via `NEXT_PUBLIC_API_URL`.

## Alternatives Considered
- Next.js Server Components fetching: Not compatible with GH Pages static export for fresh data; would still require client state for search and pagination; higher complexity.
- Vercel SSR: Adds runtime cost/ops; not required for scope; could be adopted later if SEO or per-request freshness is required.

## Open Questions (proceeding under override)
- API CORS policy assumed to allow browser access from the GH Pages origin.
- Unknown totals handling: rely on `hasNextPage`; hide totals summary if missing.


