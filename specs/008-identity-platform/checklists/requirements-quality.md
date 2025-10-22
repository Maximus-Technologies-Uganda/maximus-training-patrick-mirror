# Requirements Quality Checklist — 008-identity-platform

Purpose: Unit tests for the requirements (not implementation)
Created: 2025-10-21
Feature: specs/008-identity-platform/spec.md
Plan: specs/008-identity-platform/plan.md
Depth: Standard
Audience: PR reviewers

## Requirement Completeness
- [ ] CHK001 Are AuthN responsibilities defined for browser, BFF, and API tiers? [Completeness, Spec §FR-001–FR-004]
- [ ] CHK002 Are roles `owner` and `admin` fully defined with allowed actions? [Completeness, Spec §FR-010–FR-014]
- [ ] CHK003 Is ownership rule `authorId === userId` explicitly stated? [Completeness, Spec §FR-012]
- [ ] CHK004 Are public read endpoints clearly listed and stated as unauthenticated? [Completeness, Spec §FR-014]
- [ ] CHK005 Are CSRF requirements for all mutating methods specified? [Completeness, Spec §FR-020]
- [ ] CHK006 Is request body size limit (1MB) and validation envelope defined? [Completeness, Spec §FR-021–FR-022]
- [ ] CHK007 Is the rate limit (10 writes/min/user; IP fallback) captured? [Completeness, Spec §FR-023]
- [ ] CHK008 Are observability requirements (request-id propagation) defined? [Completeness, Spec §FR-030]
- [ ] CHK009 Are audit log fields listed for all write ops? [Completeness, Spec §FR-031]
- [ ] CHK010 Is `/health` response schema explicitly specified as `{ service:"api", status:"ok", commit:"<sha>", dependencies:{ firebase:"ok", db:"ok" }, time:"<RFC3339>" }`? [Completeness, Spec §Health Endpoint; Plan PR3 Evidence]
- [ ] CHK011 Do contracts include Bearer scheme and per-op `security` markers? [Completeness, Spec §FR-040–FR-041]
- [ ] CHK012 Are standardized error responses 401/403/422/429 plus 413/503 defined? [Completeness, Spec §FR-042–FR-043 + Final Blockers]
- [ ] CHK013 Is rollback to read-only documented, including status codes? [Completeness, Spec §FR-050 + Risks & Rollback]
- [ ] CHK014 Are environment variables and feature flags enumerated? [Completeness, Plan §Environment & Flags]

## Requirement Clarity
- [ ] CHK015 Is token refresh behavior on 401 (single `getIdToken(true)`) specified? [Clarity, Plan PR1 Reviewer]
- [ ] CHK016 Are cookie flags (HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age=1800) and 15m rotation stated? [Clarity, Spec §Final Blockers]
- [ ] CHK017 Is CORS allowlist and allowed headers/methods clearly enumerated? [Clarity, Spec §Final Blockers]
- [ ] CHK018 Is clock skew tolerance (±5m) documented? [Clarity, Spec §Security Controls]
- [ ] CHK019 Are rate-limit response headers and formats specified for both 2xx and 429 responses (include `X-RateLimit-Limit: 10`, `X-RateLimit-Remaining: <int>`, and on 429 `Retry-After: <seconds>`), and explicitly absent on CORS preflight (OPTIONS)? [Clarity, Plan PR2 Merge Gates]
- [ ] CHK020 Is OpenAPI stance “no global security; per-op only” explicitly stated? [Clarity, Plan PR2 Evidence/Checklist]
- [ ] CHK021 Are audit log field names and types unambiguous? [Clarity, Spec §FR-031]
- [ ] CHK022 Are a11y rules explicit: `aria-live="polite"` for status/progress; `aria-live="assertive"` only for blocking errors; no keyboard traps; Escape closes modals; focus moves to first invalid field on form errors; visible focus ring on all actionable elements (light/dark)? [Clarity, Spec §Final Blockers + Plan PR1 Evidence]

## Requirement Consistency
- [ ] CHK023 Is “BFF-only writes” consistent across UI, BFF, and API descriptions? [Consistency, Spec §FR-003]
- [ ] CHK024 Are status code splits consistent (401 unauthenticated, 403 unauthorized, 503 read-only)? [Consistency, Spec §Final Blockers + Risks]
- [ ] CHK025 Is App Router usage consistent: no `pages/` or `pages/api/` artifacts remain in repo or docs; all routes use `app/api/.../route.ts`? [Consistency, Plan Project Structure]
- [ ] CHK026 Do role resolution/caching rules match: if caching is used, TTL ≤ 5m; otherwise re-resolve per verified request? [Consistency, Spec §Ownership & Role Resolution; Plan PR2 Scope]
- [ ] CHK050 Is BFF-only writes enforceable: API requires a CSRF header value minted by the BFF (double-submit or signed nonce) so browsers cannot call API directly even with valid CORS? [Consistency, Spec §FR-003; Plan PR1/PR2]

## Acceptance Criteria Quality
- [ ] CHK027 Are success criteria measurable (e.g., 100% of protected ops require auth, p95 < 300ms)? [Acceptance, Spec §SC-001–SC-009]
- [ ] CHK028 Do CI evidence requirements map to measurable outputs (a11y HTML, Spectral=0, latency table)? [Acceptance, Plan PR Evidence]
- [ ] CHK029 Are coverage thresholds stated numerically (API 80/70; FE 70 lines)? [Acceptance, Plan PR4 Merge Gates]
- [ ] CHK060 Do OpenAPI responses include example payloads for 401/403/422/429/413/503 matching the standardized envelope (and are contract tests asserting the body shape specified)? [Acceptance, Spec §FR-042–FR-043; Plan PR2]

## Scenario Coverage
- [ ] CHK030 Do user stories cover anonymous, owner, and admin flows? [Coverage, Spec §User Stories]
- [ ] CHK031 Are error flows covered (invalid/expired token → 401, CSRF fail → 403)? [Coverage, Spec §Edge Cases + Plan PR2 Evidence]
- [ ] CHK032 Are recovery flows covered (token refresh; read-only fallback)? [Coverage, Spec §Final Blockers + Plan PR1/PR2]
- [ ] CHK033 Are non-functional scenarios (observability, a11y, latency snapshot) included? [Coverage, Spec §Observability & Evidence]
- [ ] CHK057 Do requirements distinguish 404 (non-existent resource) vs 403 (unauthorized to existing resource), with contract tests for both? [Coverage, Spec §Edge Cases; Plan PR2 Tests]

## Edge Case Coverage
- [ ] CHK034 Is 1MB payload overflow handled with 413 using standardized error envelope `{ code:"PAYLOAD_TOO_LARGE", ... }`? [Edge Case, Spec §Edge Cases + Final Blockers]
- [ ] CHK035 Is IP fallback for anonymous writes documented and covered? [Edge Case, Spec §FR-023 + Plan PR2 Acceptance]
- [ ] CHK036 Is token revocation behavior captured for admin-sensitive actions? [Edge Case, Spec §Security Controls + Plan PR2 Acceptance]
- [ ] CHK037 Are near-expiry tokens within ±5m accepted and outside rejected? [Edge Case, Spec §Security Controls]
- [ ] CHK056 Is rate-limit key precedence defined as `userId` → IP fallback, and do error bodies avoid leaking whether a given `userId` exists? [Edge Case, Spec §FR-023; Plan PR2]
- [ ] CHK058 Do 413 responses specify minimal/zero `Content-Length` and document stance on optional `Retry-After` for burst-related size? [Edge Case, Spec §Final Blockers; Plan PR2]

## Non-Functional Requirements
- [ ] CHK038 Are secrets sourcing and storage requirements documented (Secret Manager; no secrets in repo)? [NFR-Security, Spec §Security Controls]
- [ ] CHK039 Are timeouts (10s) specified for handlers? [NFR-Resilience, Spec §Security Controls]
- [ ] CHK040 Are logging retention (≤ 30 days) and PII redaction policies specified (redact emails, tokens, cookies, request bodies; log only opaque `userId` + `role`)? [NFR-Observability, Spec §Final Blockers; Plan PR3 Reviewer]
- [ ] CHK041 Are a11y requirements and evidence artifacts defined (HTML report, keyboard path)? [NFR-A11y, Spec §A11y + Plan PR1]
- [ ] CHK042 Is CI latency micro-bench defined with sample sizes and outputs (100×GET + 20×WRITE @ c=5) and p50/p95 table in job summary with raw CSV archived? [NFR-Performance, Plan PR3 Evidence]
- [ ] CHK049 Are JWT verification semantics documented (enforce `aud`, `iss`, `exp`, `sub`; reject tokens from other Firebase projects)? [NFR-Security, Spec §Security Controls]
- [ ] CHK051 Are CORS preflight (OPTIONS) behaviors specified (204, correct `Access-Control-*` headers, no auth required)? [NFR-Security, Plan PR1/PR2]
- [ ] CHK052 Is `/health` unauthenticated, non-cacheable (`Cache-Control: no-store`), and specified to return 503 when a dependency is down? [NFR-Resilience, Plan PR3; Spec §Health]
- [ ] CHK053 Is trace correlation specified such that `x-request-id` and `traceparent` are preserved Browser → BFF → API and appear in logs for the same request across services? [NFR-Observability, Spec §FR-030; Plan PR3]
- [ ] CHK054 Are audit logs write-only from app code, restricted to ops/service accounts for read; retention policy declared (e.g., 90d) and stored out of request path? [NFR-Security, Spec §FR-031; Plan PR3]
- [ ] CHK055 Do unauthenticated responses contain no sensitive PII (no emails, tokens, cookies)? [NFR-Security, Spec §Security Controls]
- [ ] CHK059 Is infra time synchronization (e.g., chrony/NTP) required/assumed documented to support clock-skew tolerances? [NFR-Operational, Spec §Security Controls]

## Dependencies & Assumptions
- [ ] CHK043 Are role assignment and source of truth assumptions documented (out-of-band)? [Assumption, Spec §Assumptions & Dependencies]
- [ ] CHK044 Is canonical contracts location declared and sync process documented? [Traceability, Plan PR2 Files]
- [ ] CHK045 Is environment/flags table present and accurate for FE/BFF/API? [Traceability, Plan §Environment & Flags]

## Ambiguities & Conflicts
- [ ] CHK046 Are any vague terms (e.g., “public”, “rotate”) quantified where needed? [Ambiguity, Spec §Final Blockers]
- [ ] CHK047 Do plan PR scopes exclude cross-cutting edits to prevent drift? [Consistency, Plan PR Out-of-scope]
- [ ] CHK048 Is the distinction between per-op and global OpenAPI security free of contradictions? [Conflict, Plan vs Spec]

## Trace Links
| CHK | Spec/Plan Anchor |
|-----|-------------------|
| CHK025 | Plan: Project Structure (App Router), PR1 Files (app/api routes) |
| CHK026 | Spec: Ownership & Role Resolution; Plan PR2 Scope (role cache note) |
| CHK019 | Plan PR2 Merge Gates (rate-limit headers) |
| CHK020 | Plan PR2 Evidence/Checklist (no global security) |
| CHK012 | Spec Final Blockers + FR-042/FR-043 (413/503 envelopes) |
| CHK014 | Plan Environment & Flags table |
| CHK010 | Plan PR3 Evidence/Acceptance (`/health` keys & schema) |
| CHK040 | Spec Final Blockers; Plan PR3 Reviewer Checklist (redaction) |

Notes: Items marked [Gap]/[Ambiguity]/[Conflict] indicate areas to refine the spec before planning/implementation.

Gate: Checklist is considered “passing” when each checked item links to (a) a spec/plan anchor and (b) a corresponding evidence artifact (e.g., a11y HTML, Spectral report, CI summary, screenshots).
