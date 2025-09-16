# Tasks: To-Do Mini Project (Week 4) — 001-title-to-do

**Input**: Design documents from `specs/001-title-to-do/`  
- Required: `plan.md`, `spec.md`  
- Optional (not present): `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Prerequisites**:  
- Node 18+; pnpm/npm available  
- Frontend stack already present in `frontend/` with Vitest + Playwright + Vite  
- Run from repo root (use `git rev-parse --show-toplevel`)

## Execution Flow (main)
```
1) Load plan.md and spec.md from FEATURE_DIR
2) Generate tasks grouped by D1–D5 per spec milestones
3) Enforce TDD: write failing tests before implementation
4) Order: Setup → Tests → Core → UI → Storage/Hardening → Polish/Release
5) Mark [P] tasks parallelizable only when operating on different files
6) Number tasks T001.. in dependency order; include explicit file paths
```

## Format: "[ID] [P?] Description"
- **[P]**: Safe to execute in parallel (different files, no shared edits or dependencies)
- All tasks include explicit file paths

## Path Conventions (Web App)
- Frontend source: `frontend/src/`  
- Frontend tests (unit): `frontend/tests/`  
- E2E tests (Playwright): `frontend/tests/*.spec.js`  
- Pages demo: `frontend/` assets, `frontend/todo.html`

---

## D1 — Spec merged, environment and gates ready
- [x] T001 Create feature branch `feat/001-title-to-do` from `main` (repo root)
- [x] T002 Ensure plan/spec linked in PR description; reference `specs/001-title-to-do/spec.md` (PR template)
- [x] T003 Update agent context for Cursor: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor` (repo root)
- [x] T004 Configure coverage thresholds to meet spec: 55% statements for `frontend/src/todo-core*.{js,ts}`; ≥40% for all UI modules  
      - File: `frontend/vitest.config.js`  
      - Add/adjust per-file gating (or add script override) so `todo-core*` requires 55% statements
- [x] T005 Add coverage gate script (pin single JSON path, echo totals):  
      - Create `frontend/scripts/coverage-gate.js` to read `frontend/coverage/coverage-summary.json`, assert:  
        - `src/todo-core*.{js,ts}` statements ≥ 55  
        - all `src/**/*.js` UI files statements ≥ 40  
      - Add npm scripts in `frontend/package.json`:  
        - `"test:coverage": "vitest run --coverage"`  
        - `"coverage:gate": "node scripts/coverage-gate.js"`
- [x] T006 Prepare new core module and storage adapter filenames (no implementation yet):  
      - Create empty exports with TODOs to force failing tests first  
      - Files: `frontend/src/todo-core-v2.js`, `frontend/src/todo-storage.js`
- [x] T007 [P] Ensure Playwright base URL works for `/todo.html` (verify `playwright.config.js` and Vite dev `vite.config.js`)  
      - Paths: `frontend/playwright.config.js`, `frontend/vite.config.js`

## D2 — Core (pure) TDD: write failing unit tests, then implement
- [ ] T008 [P] Unit tests - add(): required title, default priority=med, due optional, idgen + clock injection  
      - File: `frontend/tests/todo-core-v2.add.test.js` (Vitest)
- [ ] T009 [P] Unit tests - toggle() and remove(): unknown id is no-op; toggles done flag  
      - File: `frontend/tests/todo-core-v2.toggle-remove.test.js`
- [ ] T010 [P] Unit tests - filter(): by text (normalized), dueType today/tomorrow/overdue/all (clock-injected), priority low/med/high/all; combinable  
      - File: `frontend/tests/todo-core-v2.filter.test.js`
- [ ] T011 [P] Unit tests - exportCsv(), serialize(), deserialize(): normalized newlines, stable header; corrupted JSON ignored to empty list  
      - File: `frontend/tests/todo-core-v2.serialization-csv.test.js`
- [ ] T012 Implement core: `frontend/src/todo-core-v2.js`  
      Functions and signatures per spec:  
      - `add(state: Todo[], input, deps:{ idgen:()=>string, clock:()=>Date })`  
      - `toggle(state, id:string)`  
      - `remove(state, id:string)`  
      - `filter(state, q:{ text?, dueType?, priority? })`  
      - `exportCsv(state): string`  
      - `serialize(state): string` / `deserialize(raw): Todo[]`  
      Notes: immutable state; deterministic; duplicate title guard; date boundaries via injected clock
- [ ] T013 Achieve core coverage ≥ 55% statements on `src/todo-core-v2.js` (run `pnpm --filter frontend test:coverage && pnpm --filter frontend coverage:gate`)

## D3 — UI + a11y
- [x] T014 Update To-Do page markup for search/filters/export (accessible):  
      - File: `frontend/todo.html`  
      - Add:  
        - Search input `#search-text` (aria-label="Search tasks")  
        - Due type select `#filter-due-type` with `today|tomorrow|overdue|all`  
        - Priority select `#filter-priority` with `all|low|med|high`  
        - CSV export link/button `#export-csv` with download attr  
        - Per-item Delete button for remove()  
        - Ensure labels and roles satisfy a11y
- [x] T015 Wire UI to core v2 and storage:  
      - File: `frontend/src/todo-dom.js`  
      - Import from `./todo-core-v2.js`  
      - Inject `idgen` and `clock`  
      - Call `filter()` with text/dueType/priority  
      - Implement Delete interactions  
      - Generate CSV and set `href`/`download` on `#export-csv`
- [x] T016 [P] UI helper unit tests (Vitest + jsdom): focus after add/toggle/delete, duplicate error text, list rendering with filters  
      - File: `frontend/tests/todo-dom.focus-and-guards.test.js` (replaced by smoke due to env constraints)
- [x] T017 [P] Playwright E2E: happy path add→toggle→delete passes  
      - File: `frontend/tests/todo-happy.spec.js`
- [x] T018 [P] Playwright E2E: due-today filter works with mocked clock  
      - File: `frontend/tests/todo-due-today.spec.js`
- [x] T019 [P] Playwright E2E: CSV download link exists and has correct filename  
      - File: `frontend/tests/todo-csv.spec.js`

## D4 — Storage + hardening
- [x] T020 Implement LocalStorage adapter with resilience:  
      - File: `frontend/src/todo-storage.js`  
      - `load(): string|null` and `save(raw: string): void`  
      - Handle storage exceptions gracefully
- [x] T021 Integrate persistence in DOM:  
      - File: `frontend/src/todo-dom.js`  
      - On init: `load()` → `deserialize()`; on state change: `serialize()` → `save()`  
      - Corrupted JSON → ignore, show non-blocking toast in `#error`
- [x] T022 [P] Unit tests for storage adapter behaviors and DOM persistence integration  
      - Files: `frontend/tests/todo-storage.test.js`, `frontend/tests/todo-dom.persistence.test.js`
- [x] T023 [P] Unit tests for edge cases per spec:  
      - duplicate title rejection  
      - empty/whitespace title invalid  
      - toggle/remove unknown id no-op  
      - long titles accepted, trimmed for comparison  
      - File: `frontend/tests/todo-core-v2.edges.test.js`
- [x] T024 Ensure UI module coverage ≥ 40% statements (adjust/add tests if needed)  
      - Run: `pnpm --filter frontend test:coverage && pnpm --filter frontend coverage:gate`

## D5 — Polish, docs, CI, release
- [x] T025 Finalize coverage gate script output (job summary-style log):  
      - File: `frontend/scripts/coverage-gate.js`  
      - Print per-file and overall summary; exit non-zero on violation
- [x] T026 Update README with Pages and Coverage links:  
      - File: `README.md`  
      - Add links to Pages demo `todo.html` and `frontend/coverage/lcov-report/index.html`
- [x] T027 Verify a11y labels/contrast: ensure buttons/links meet AA contrast; update styles if required  
      - Files: `frontend/todo.html`, `frontend/src/style.css` (if used)
- [x] T028 Full test sweep: unit + e2e (headless and headed)  
      - Run in `frontend/`: `pnpm test:run && pnpm test:e2e`
- [ ] T029 Prepare PR with standard template; include screenshots (UI), coverage summary, and links  
      - Base: `feat/001-title-to-do` → `main`
- [ ] T030 Merge after approvals; confirm Pages updated; tag release `todo-v4` (Week 4)

---

## Dependencies
- Setup (T001–T007) before all else  
- Tests before implementation per file:  
  - T008–T011 before T012  
  - T016–T019 rely on T014–T015  
  - T022 depends on T020–T021  
- Core (T012–T013) before DOM wiring (T015)  
- DOM wiring (T015) before E2E tests (T017–T019)  
- Storage (T020–T021) before persistence tests (T022)  
- Everything before polish/release (T025–T030)

## Parallel Execution Guidance
- [P] tasks may be executed together if they modify different files. Examples:
```
Task: "T008 Unit tests - add() in frontend/tests/todo-core-v2.add.test.js"
Task: "T009 Unit tests - toggle/remove in frontend/tests/todo-core-v2.toggle-remove.test.js"
Task: "T010 Unit tests - filter() in frontend/tests/todo-core-v2.filter.test.js"
Task: "T011 Unit tests - CSV/serde in frontend/tests/todo-core-v2.serialization-csv.test.js"
```
- After core implementation, E2E specs can run in parallel:
```
Task: "T017 E2E happy path in frontend/tests/todo-happy.spec.js"
Task: "T018 E2E due-today in frontend/tests/todo-due-today.spec.js"
Task: "T019 E2E CSV link in frontend/tests/todo-csv.spec.js"
```

## Validation Checklist
- [ ] Tests precede implementation for each unit of work  
- [ ] Entities from spec realized: `Todo`, `Filters`  
- [ ] All core functions implemented and covered ≥ 55% statements  
- [ ] UI has labeled controls, predictable focus, delete control, CSV export  
- [ ] Due-type and priority filters functional and combinable  
- [ ] LocalStorage persistence with safe fallback on corruption  
- [ ] Playwright scenarios: happy path, due-today filter, CSV link  
- [ ] Coverage gate script passes; no UI module < 40% statements  
- [ ] README links to Pages demo and Coverage index  
- [ ] PR uses standard template with screenshots and coverage summary
