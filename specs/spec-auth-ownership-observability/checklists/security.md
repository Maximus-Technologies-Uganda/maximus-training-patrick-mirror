# Security Requirements Quality Checklist: Auth, Ownership, Observability

**Purpose**: Validate the quality and completeness of security-related requirements
**Created**: 2025-10-13
**Feature**: ../spec.md

## Authentication & Sessions

- [ ] CHK001 Are authentication inputs, outputs, and error states explicitly specified (including 401 semantics)? [Completeness, Spec §FR-001/FR-002/FR-003]
- [ ] CHK002 Is the credential flow (username + password) clearly defined with invalid input handling and throttling policy noted or deferred? [Clarity, Spec §FR-005, Gap]
- [ ] CHK003 Are session lifetime policies (absolute/idle) clearly stated and measurable? [Clarity/Measurability, Spec §FR-006]
- [ ] CHK004 Are cookie attributes (`HttpOnly`, `Secure`, SameSite) mandated and non-overrideable by clients? [Consistency, Spec §Assumptions; Spec §FR-001]

## Authorization & Ownership

- [ ] CHK005 Is `ownerId` assignment server-controlled and immutable by clients? [Consistency, Spec §FR-010/FR-013]
- [ ] CHK006 Is the ownership check unambiguously defined as `session.userId === post.ownerId` for update/delete? [Clarity, Spec §FR-012]
- [ ] CHK007 Are public read endpoints explicitly excluded from authentication? [Consistency, Spec §FR-014]

## API Contracts & Errors

- [ ] CHK008 Does OpenAPI define the cookie security scheme and mark all CUD endpoints as protected? [Completeness, Spec §FR-020/FR-021]
- [ ] CHK009 Are standardized `401`/`403` error schemas defined with required fields? [Clarity, Spec §FR-022]
- [ ] CHK010 Are `404` semantics defined without leaking ownership information? [Clarity/Consistency, Spec §User Story 2; Spec §Acceptance]

## Observability & Privacy

- [ ] CHK011 Do logging requirements exclude secrets/PII and specify allowed fields? [Gap, Spec §FR-030]
- [ ] CHK012 Is `X-Request-Id` mandated and consistently propagated across components and logs? [Consistency, Spec §FR-031]
- [ ] CHK013 Is `/health` defined for readiness without exposing sensitive internals? [Clarity, Spec §FR-032]

## Deployment & Config

- [ ] CHK014 Is the session secret management via managed secrets explicitly required (no hardcoding)? [Completeness, Spec §FR-004]
- [ ] CHK015 Are environment configuration requirements listed for Cloud Run/Cloud Build (secret injection, env vars)? [Completeness, Spec §FR-004, Gap]
