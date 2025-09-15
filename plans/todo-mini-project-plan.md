## Implementation Plan: To-Do Mini Project (Week 4)

**Branch**: `001-title-to-do` | **Date**: 2025-09-15 | **Spec**: `specs/001-title-to-do/spec.md`

### Summary
Build a durable, accessible To-Do application with deterministic, pure core logic and a thin DOM layer. Deliver a production-shaped slice with spec-first development, coverage thresholds enforced in CI, WCAG AA accessibility checks, Playwright E2E tests, and a live Pages demo linked from the README. Scope includes create/toggle/delete, search, priority (low/med/high), due types (today/tomorrow/overdue/all), CSV export, and LocalStorage persistence. Out of scope: auth, network sync, multi-user, server APIs.

---

## Day-by-Day Plan

### Day 1: Spec (Completed)
- Finalize and merge the feature specification, ensuring:
  - User scenarios and acceptance criteria are explicit and testable.
  - Functional requirements FR-001 … FR-011 captured with success metrics.
  - Risks, mitigations, and rollback are documented.
- Gate checks: No [NEEDS CLARIFICATION] markers remain; scope bounded.

### Day 2: Core Logic (TDD)
- Objectives:
  - Implement pure core in a standalone module with deterministic behavior and injected dependencies (`idgen`, `clock`).
  - Functions: `add`, `toggle`, `remove`, `filter`, `exportCsv`, `serialize`, `deserialize`.
  - Unit tests first (RED), then minimal implementation (GREEN), then refactor.
- Test coverage targets:
  - `frontend/src/todo-core*.{js,ts}`: ≥55% statements.
  - Enforce via CI coverage gate.
- Test scenarios (table-driven where suitable):
  - Duplicate title guard; empty/whitespace title rejected with clear error semantics.
  - Due-type boundaries using fake timers (inject `clock()`); today/tomorrow/overdue cutoffs.
  - CSV golden output: stable header order, normalized `\n` line endings.
  - `toggle`/`remove` with unknown `id` are no-ops.
  - Long titles and typical Unicode text.
- Deliverables:
  - Core module with function signatures per spec.
  - Unit test suite and golden file(s) for CSV.
  - Coverage report demonstrating thresholds met.

### Day 3: UI & Accessibility (A11y)
- Objectives:
  - Thin DOM layer using the core APIs; no business logic in the view.
  - A11y: labeled controls, keyboard navigation, predictable focus after add/toggle/delete, AA contrast for interactive elements.
  - Focus targets must be explicitly defined. e.g., After Add -> focus returns to the title input. After Delete -> focus moves to the next item or the list container.
  - Filtering UI: text, due-type, priority with combinable criteria.
- Tests:
  - DOM/unit tests for rendering and behavior (focus movement, label associations, formatting guards).
  - Automated a11y checks (e.g., axe) integrated into CI for key pages/components.
- Deliverables:
  - UI components/pages wired to core; accessible labels and roles.
  - A11y test suite passing baseline checks.
  - Visual indicators for completion state and priority.

### Day 4: Persistence & Hardening
- Objectives:
  - Implement LocalStorage-backed persistence with `serialize`/`deserialize`.
  - Hardening: corrupted JSON gracefully ignored (fallback to empty list) with non-blocking notice/toast.
  - Defensive coding around time-based logic; maintain determinism with injected `clock()`.
- Tests:
  - Storage adapter tests (load/save, corrupted payload handling).
  - Resilience tests for boundary dates and large lists.
- Deliverables:
  - Storage adapter abstraction with unit tests.
  - UI integration for load-on-start and save-on-change.
  - Error-handling path validated (no crashes, user informed when data ignored).

### Day 5: E2E, Polish & Release
- Objectives:
  - Playwright E2E: happy-path add→toggle→delete, due-today filter, CSV download link exists and triggers download.
  - Documentation polish: README updates, coverage index link, Pages demo link.
  - Visual polish and contrast validation to AA.
- CI Gates and Release:
  - All unit/DOM/A11y/E2E tests green.
  - Coverage gates enforced: core ≥55% statements; no UI module <40% statements.
  - Pages deployed; README updated with demo and coverage links.
  - Prepare a small, reviewable PR series; merge after green CI.
- Deliverables:
  - Passing E2E suite and artifacts.
  - README and demo updated; release notes entry.
  - Document any key decisions or 'as-built' notes in the README.

---

## Technical Context
- **Language/Version**: JavaScript (ES modules)
- **Primary Dependencies**: Vite (dev/build), Vitest (unit), Playwright (E2E), eslint (lint)
- **Storage**: Browser LocalStorage via isolated adapter
- **Testing**: TDD with Vitest; Playwright for E2E; fake timers for time boundaries
- **Target Platform**: Web (modern evergreen browsers)
- **Project Type**: Web application (frontend with pure core library)
- **Performance Goals**: Instant interactions on lists up to a few thousand items; CSV export under 100 ms for 1k items
- **Constraints**: Deterministic core, offline-capable, WCAG 2.1 AA for interactive elements
- **Scale/Scope**: Single-user, local persistence; no server APIs

---

## Constitution Check
### Simplicity
- Projects: 1 (frontend app with a pure core module)
- Framework usage: Direct, no wrappers; thin DOM layer
- Data model: Single `Todo` entity; no DTOs beyond serialization format
- Patterns: Avoid repositories/UoW; inject `idgen` and `clock` for determinism

### Architecture
- Feature ships as a small library (`todo-core`) consumed by the UI layer
- CLI not required for scope; documentation included in README and spec artifacts

### Testing (Non‑Negotiable)
- Enforce RED→GREEN→Refactor across core modules
- Commit order: tests before implementation where feasible
- Contract→Integration→E2E→Unit ordering applied pragmatically to a frontend-only stack
- Use real browser environment for E2E; fake timers for core unit tests

### Observability
- User-facing non-blocking notice on storage corruption
- Structured console logs in dev; no PII persisted

### Versioning
- Semantic versioning for the project/release notes; build increments per CI

Gate Result: Initial Constitution Check PASS (no unjustified complexity)

---

## Project Structure
### Documentation
```
specs/001-title-to-do/
├── spec.md              # Approved specification (completed)
└── (this plan is saved at: /plans/todo-mini-project-plan.md)
```

### Source (existing repo conventions)
```
frontend/
├── src/
│   ├── todo-core.js     # pure functions (existing or to be created/expanded)
│   ├── todo-dom.js      # thin DOM layer
│   └── ...
└── tests/               # Vitest + Playwright specs
```

Structure Decision: Web application with pure core consumed by UI.

---

## Phase 0: Outline & Research
- Unknowns extracted from spec: None blocking; clarify focus management details per control and verify color contrast tokens meet AA.
- Research tasks to document (lightweight):
  - A11y focus order after add/toggle/delete (patterns for lists)
  - WCAG AA contrast for buttons/links with existing theme
  - CSV normalization across OS line endings

Output: Short notes appended to README/DEVNOTES; no ADRs required.

---

## Phase 1: Design & Contracts
### Data Model
`Todo` = { id: string, title: string, due: Date|null, priority: 'low'|'med'|'high', done: boolean }

### Core API (pure)
- `add(state, input, deps)` → state'
- `toggle(state, id)` → state'
- `remove(state, id)` → state'
- `filter(state, query)` → filtered subset
- `exportCsv(state)` → string
- `serialize(state)` → string; `deserialize(raw)` → state

Validation and boundaries are enforced in the pure layer; UI only orchestrates.

### Quickstart (dev)
1) Install and run frontend dev server.
2) Run unit tests with coverage; ensure core meets ≥55% statements.
3) Run Playwright E2E locally and in CI.

Outputs: Pure module, tests, and quickstart steps captured in README.

---

## Phase 2: Task Planning Approach (Description Only)
- Generate dependency-ordered tasks from the above design:
  - Core unit tests → implement core → refactor
  - DOM layer integration and a11y checks
  - Storage adapter and resilience tests
  - E2E flows and documentation polish
 - Mark independent test files as [P] for parallel work

Estimated: 25–30 granular tasks across core, UI, storage, E2E, and docs.

Note: Days represent our timeboxes, while Phases are the logical steps (e.g., design, implementation) that occur within those timeboxes.

---

## Risks & Rollback
- LocalStorage corruption → ignore bad JSON; show non-blocking toast; start empty list
- Flaky time-based tests → inject `clock()`; use fake timers in unit tests
- Coverage gate path drift → pin single JSON path in CI; echo totals in job summary

---

## Success Criteria & Acceptance
- Coverage: `frontend/src/todo-core*.{js,ts}` ≥55% statements; no UI module <40%
- E2E: happy-path (add→toggle→delete), due-today filter works, CSV link exists
- A11y: labeled controls; predictable focus handling; AA contrast
- Pages: demo updated; README links to Pages and Coverage Index

---

## Progress Tracking
- [x] Day 1: Spec complete
- [ ] Day 2: Core logic and tests complete
- [ ] Day 3: UI & A11y complete
- [ ] Day 4: Persistence & Hardening complete
- [ ] Day 5: E2E, Polish & Release complete


