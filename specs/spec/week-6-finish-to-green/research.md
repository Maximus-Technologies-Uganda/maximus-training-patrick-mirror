# Research and Decisions — Finish-to-Green (Week 6)

## Clarifications
- Frontend Cloud Run URL: `https://maximus-training-frontend-673209018655.africa-south1.run.app`
- API Cloud Run URL: `https://maximus-training-api-673209018655.africa-south1.run.app`
- Pending: Linear issue ID/URL for v6.0.0 release notes.

## Key Decisions
1. Data fetching via server route handler
   - Decision: Implement Next.js route handler at `frontend-next/src/app/api/posts/route.ts`.
   - Rationale: Avoids client `NEXT_PUBLIC_API_URL` dependency; enables secure server-to-server calls.
   - Alternatives: Client-side fetch with public base URL (rejected due to config drift and security).

2. CI evidence surfacing
   - Decision: Print a distinct `frontend-next` coverage block to `$GITHUB_STEP_SUMMARY` and upload coverage and Playwright artifacts.
   - Rationale: Fast reviewer verification; single-run evidence.
   - Alternatives: Only store artifacts without summaries (rejected due to discoverability).

3. A11y and contract artifacts
   - Decision: Upload artifacts and include concise pass/fail summaries in the Quality Gate job summary.
   - Rationale: Clear signal without navigating full reports.

4. Release tagging
   - Decision: Tag `v6.0.0` with release notes linking spec, Linear issue, green CI run, and live demo.
   - Rationale: Auditable, evidence-backed release.

## Risks and Mitigations
- Backend downtime: Show error state; retry once; avoid infinite loaders.
- URL changes: Keep URLs in one config source; avoid client exposure.
- CI time: Summaries keep reviewers efficient; artifacts available for deep dive.


