# Engineering Constitution

## Core Principles

### I. Outcomes Over Output
We optimize for measurable user and business impact, not lines of code or feature count. Every significant change ties to an objective with clear success metrics and observable results.

### II. Simplicity and Clarity First
Prefer the simplest design that works. Avoid speculative abstractions (YAGNI) and reduce cognitive load through clear naming, small modules, and explicit interfaces. Documentation and ADRs accompany non-trivial decisions.

### III. Security and Privacy by Design (Non‑Negotiable)
Threat model meaningful changes, default to least privilege, keep secrets out of code, and patch dependencies proactively. Data is encrypted in transit and at rest; access to PII is audited and minimized.

### IV. Reliability and Performance with SLOs
Define SLIs/SLOs and use error budgets to balance velocity and stability. Engineer for graceful degradation, backpressure, idempotency, timeouts, retries, and capacity headroom.

### V. Test‑Driven Quality and Automation
Adopt a test-first mindset. Maintain a healthy pyramid: fast unit tests, pragmatic integration/contract tests, and targeted end-to-end tests. CI is deterministic and blocks merges on failures and policy gates.

### VI. Trunk‑Based Development with Code Review
Work in short-lived branches and merge small, frequent PRs behind feature flags. Require peer review, pre-merge CI, and clear, conventional commits. Keep main releasable at all times.

### VII. Observability and Operability
Ship with structured logs, metrics, and traces. Provide health checks, dashboards, and actionable alerts with runbooks. Practice blameless post-incident reviews and continuous improvement.

## Engineering Constraints and Standards

- Languages and Tooling: Choose fit-for-purpose stacks; enforce formatters, linters, and type checks. Automate via CI. Reproducible builds and lockfiles required.
- API and Contracts: Design-first via OpenAPI/JSON Schema/GraphQL SDL. Backward‑compatible by default, version changes, and publish changelogs and deprecation schedules.
- Data and Migrations: Use schema migration tooling; write forward and backward compatible migrations; capture data retention and privacy policies (e.g., GDPR, data minimization).
- Dependency Hygiene: Pin and regularly update dependencies; scan for vulnerabilities (SCA/SAST/DAST); maintain an SBOM for production artifacts.
- Documentation: Each service/library includes a README, quickstart, and operational notes. Record decisions in ADRs. Spec/Plan/Tasks live under `specs/<feature>/` when applicable.
- Accessibility and UX: Follow WCAG 2.1 AA for user-facing experiences; include keyboard navigation and screen reader support where relevant.
- Secrets and Config: No secrets in source control. Use a secure secret manager and 12‑factor configuration.

## Development Workflow

1. Intake and Scoping
   - Capture intent and constraints. Use `/specify` to create `specs/<feature>/spec.md` on a feature branch.
2. Plan
   - Use `/plan` to produce `plan.md` and supporting artifacts (e.g., data‑model.md, contracts/). Confirm acceptance criteria and non‑functional needs (SLOs, security).
3. Task Breakdown
   - Use `/tasks` to generate dependency‑ordered tasks. Prioritize small, independently releasable slices behind flags.
4. Implement
   - Follow TDD where practical. Keep PRs < ~400 LOC. Adhere to coding standards and add/modify ADRs for noteworthy decisions.
5. Code Review and Quality Gates
   - At least one qualified reviewer (two for risky changes). CI must pass: build, tests, coverage thresholds, lint/type checks, security scans, and contract tests.
6. Merge and Release
   - Squash merge to main after green CI. Auto-version and changelog. Deploy using progressive delivery (e.g., canary), with rollback and kill‑switches.
7. Operate and Learn
   - Monitor SLOs and alerts, document runbooks. Conduct post‑release validation and, when applicable, blameless retros with tracked action items.

## Governance

- Authority and Scope: This constitution establishes minimum bars. Teams may add stricter policies but not weaker ones. In conflicts, this document prevails.
- Ownership: The Architecture/Platform Council (or designated principals) owns this document. CODEOWNERS enforce protected reviews on changes to `.specify/memory/constitution.md`.
- Enforcement: CI enforces quality gates (tests, coverage, lint/type, security scans). PR templates include a compliance checklist. Periodic audits sample services for adherence.
- Exceptions: Time‑boxed waivers require explicit risk acknowledgement, a remediation plan, and an owner. Track in `WAIVERS.md` with expiry dates.
- Amendments: Propose changes via PR with: motivation, alternatives, impact analysis, migration plan, and rollout strategy. Require ≥2 approvals including one principal/architect.
- Versioning: Use semantic versioning for this constitution (MAJOR for breaking policy, MINOR for new requirements, PATCH for clarifications). Document effective dates and transition windows.

**Version**: 1.0.0 | **Ratified**: 2025-09-15 | **Last Amended**: 2025-09-15