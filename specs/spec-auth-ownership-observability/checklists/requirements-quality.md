# Requirements Quality Checklist: Auth, Ownership, Observability

**Purpose**: Validate requirements completeness, clarity, consistency, measurability, and coverage for this feature
**Created**: 2025-10-13
**Feature**: ../spec.md

## Requirement Completeness

- [ ] CHK001 Are authentication inputs, outputs, and failure states fully enumerated for sign-in/sign-out? [Completeness, Spec §FR-001/FR-002; Spec §User Story 1; Spec §Acceptance Criteria]
- [ ] CHK002 Are session validation requirements captured for all protected endpoints? [Completeness, Spec §FR-003]
- [ ] CHK003 Are ownership enforcement requirements documented for create, update, and delete operations? [Completeness, Spec §FR-010/FR-011/FR-012/FR-013]
- [ ] CHK004 Are public read requirements explicitly stated and bounded? [Completeness, Spec §FR-014]
- [ ] CHK005 Are OpenAPI security schemes and protection markings specified for all CUD endpoints? [Completeness, Spec §FR-020/FR-021]
- [ ] CHK006 Are standardized error schemas required wherever 401/403 appear? [Completeness, Spec §FR-022]
- [ ] CHK007 Are observability requirements defined for logs, request-id propagation, and health checks? [Completeness, Spec §FR-030/FR-031/FR-032]

## Requirement Clarity

- [ ] CHK008 Is the login credential flow precisely defined as username + password, including invalid input handling? [Clarity, Spec §FR-005]
- [ ] CHK009 Are session lifetime values explicit (absolute and idle) and tied to policy language? [Clarity, Spec §FR-006]
- [ ] CHK010 Are cookie attributes (`HttpOnly`, `Secure`, SameSite policy) explicitly required and non-ambiguous? [Clarity, Spec §Assumptions; Spec §FR-001]
- [ ] CHK011 Is the authorization check expressed unambiguously as equality of `session.userId` to `post.ownerId` for update/delete? [Clarity, Spec §FR-012]
- [ ] CHK012 Are OpenAPI error schema fields (shape/fields/message format) specified rather than implied? [Clarity, Spec §FR-022, Gap]
- [ ] CHK013 Is the canonical header name for request correlation explicitly defined and used consistently? [Clarity, Spec §FR-031; Spec §Assumptions]

## Requirement Consistency

- [ ] CHK014 Do public read requirements align with security markings in OpenAPI (no accidental protection)? [Consistency, Spec §FR-014/FR-021]
- [ ] CHK015 Are ownership rules consistent across Create vs Update/Delete (server sets ownerId; clients cannot override)? [Consistency, Spec §FR-010/FR-013]
- [ ] CHK016 Do logging requirements (fields) align with success criteria on `request-id` presence? [Consistency, Spec §FR-030/FR-031; Spec §SC-004]
- [ ] CHK017 Are cookie/security assumptions consistent with authentication and session validation requirements? [Consistency, Spec §Assumptions; Spec §FR-001/FR-003]

## Acceptance Criteria Quality

- [ ] CHK018 Do all functional requirements have objective acceptance criteria stated? [Acceptance Criteria, Spec §Acceptance Criteria by Requirement]
- [ ] CHK019 Are success criteria measurable and technology-agnostic? [Measurability, Spec §Success Criteria]
- [ ] CHK020 Are rejection conditions for 401/403/404 explicitly covered in acceptance criteria? [Completeness/Measurability, Spec §Acceptance Criteria; Spec §Edge Cases]

## Scenario Coverage

- [ ] CHK021 Are primary flows covered: sign-in, sign-out, create, update, delete, read, request tracing? [Coverage, Spec §User Stories 1–4]
- [ ] CHK022 Are exception flows covered: invalid credentials, tampered/expired session, forbidden ownership, not found? [Coverage, Spec §Edge Cases; Spec §FR-003/FR-012]
- [ ] CHK023 Are alternate flows covered: idempotent sign-out, repeated sign-in replacing session, client-provided owner fields ignored/rejected? [Coverage, Spec §Edge Cases; Spec §FR-002/FR-013]

## Edge Case Coverage

- [ ] CHK024 Are boundary conditions for session tampering/expiry documented with required outcomes? [Edge Case, Spec §Edge Cases; Spec §FR-003]
- [ ] CHK025 Is `request-id` collision handling policy specified (or explicitly deemed negligible)? [Edge Case, Spec §Edge Cases]
- [ ] CHK026 Are invalid username/password format constraints and handling defined? [Edge Case/Clarity, Spec §Edge Cases; Spec §FR-005, Gap]

## Non-Functional Requirements

- [ ] CHK027 Are structured log fields and severity taxonomy specified for both web layer and API? [NFR/Clarity, Spec §FR-030]
- [ ] CHK028 Is a policy stated for sensitive data in logs (e.g., no secrets/PII)? [NFR/Gap, Spec §FR-030]
- [ ] CHK029 Are readiness expectations for `/health` response shape and failure semantics documented? [NFR/Clarity, Spec §FR-032]
- [ ] CHK030 Are timing expectations for user-facing flows stated (e.g., sign-in responsiveness)? [NFR/Measurability, Spec §SC-001]

## Dependencies & Assumptions

- [ ] CHK031 Are external dependencies and configuration (secret storage, env injection) documented as requirements? [Dependency, Spec §FR-004]
- [ ] CHK032 Are assumptions about username uniqueness/immutability explicitly linked to ownership attribution? [Assumption, Spec §Assumptions]
- [ ] CHK033 Is the chosen correlation header standardized across components and environments? [Dependency/Consistency, Spec §FR-031; Spec §Assumptions]

## Ambiguities & Conflicts

- [ ] CHK034 Are standardized error schemas defined with field-level specificity to avoid ambiguity? [Ambiguity, Spec §FR-022, Gap]
- [ ] CHK035 Are scope boundaries (out of scope items) free of contradictions with functional requirements? [Conflict, Spec §Out of Scope vs §FR-*]
- [ ] CHK036 Is there a mapping between FRs and OpenAPI endpoints to ensure traceability? [Traceability/Gap, Spec §FR-020/FR-021]
