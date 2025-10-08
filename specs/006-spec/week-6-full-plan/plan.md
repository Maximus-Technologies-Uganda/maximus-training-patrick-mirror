
# Implementation Plan: Week 6 – Finish-to-Green for frontend-next

**Branch**: `[006-spec/week-6-full-plan]` | **Date**: 2025-10-08 | **Spec**: `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\spec.md`
**Input**: Feature specification from `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Make `frontend-next` first-class in CI (Quality Gate + Review Packet), deploy an SSR demo on Cloud Run, ship a11y smokes and client contract checks with visible evidence, and clean up governance before tagging `v6.0.0`. Runtime calls are made via server-side Route Handlers; the client uses relative paths (e.g., `/api/posts`).

## Technical Context
**Language/Version**: TypeScript (TS 5.x), Node 20+, Next.js 15.5.4, React 19.1.0  
**Primary Dependencies**: Next.js, React/ReactDOM, SWR, Zod; Playwright; Vitest + @vitest/coverage-v8  
**Storage**: N/A (client reads API)  
**Testing**: Vitest (unit/contract, coverage), Playwright (+ axe) for a11y/e2e  
**Target Platform**: Cloud Run (SSR, standalone output)  
**Project Type**: web (frontend `frontend-next`, backend `api`)  
**Performance Goals**: Demo-ready responsiveness; avoid cold starts via min-instances  
**Constraints**: Server Route Handlers for service-to-service calls; no secrets in client; CI must publish evidence  
**Scale/Scope**: Week-long slice; 4 small PRs with linked evidence

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (web application) acknowledged; focus is on `frontend-next` app and CI/deploy artifacts.

## Four Phases → Four Small PRs (map to FR-001…FR-017)

### Phase 1 (PR 1): CI Gate & Review Packet integration for frontend-next
Maps: FR-001, FR-002, FR-003, FR-004, FR-013, FR-017 (traceability)

Checklist
- Add a dedicated Review Packet job for `frontend-next` running `npm ci && npm run test:ci` in `C:\Users\LENOVO\Training\frontend-next`. Upload artifact named `coverage-frontend-next` from `./coverage/coverage-summary.json` and `./coverage/lcov.info`.
- Ensure Playwright/JSDOM outputs for `frontend-next` (HTML report and screenshots) are saved and uploaded with the Packet. Configure Playwright `reporter.html.outputFolder` to `C:\Users\LENOVO\Training\docs\ReviewPacket\a11y\html` (already set) and add screenshot upload globs.
- Extend Quality Gate to read `frontend-next` coverage summary and print totals (Statements/Branches/Functions/Lines) in a distinct block in `$GITHUB_STEP_SUMMARY`.
- On PR, link to Linear issue and reference spec. Keep PR small and auditable. Include links to an example green run once merged to `main`.
- After merge, trigger a `main` run to confirm Packet includes `coverage-frontend-next` and the Gate shows the `frontend-next` block.

Evidence hooks
- Gate summary block screenshot/URL; Packet artifact list including `coverage-frontend-next`; uploaded Playwright report path and screenshots.

### Phase 2 (PR 2): Cloud Run SSR demo + README updates
Maps: FR-005, FR-006 (Route Handlers decision), FR-007, FR-008, FR-009, FR-017

Checklist
- Build Next.js with standalone output; ensure container reads `PORT`. Verify `C:\Users\LENOVO\Training\frontend-next\Dockerfile` reflects standalone output and `next start` in production.
- Implement server Route Handlers for API calls (client uses `/api/posts`); remove reliance on `NEXT_PUBLIC_API_URL` for browser calls. Ensure server-side identity config (no secrets in client).
- Configure Cloud Build → Cloud Run deploy:
  - Region `africa-south1`, service name `maximus-training-frontend`, min-instances `1`, registry `gcr.io`.
  - Wire CI trigger or document manual gcloud build/deploy steps.
- Update README (`C:\Users\LENOVO\Training\frontend-next\README.md`):
  - Add `## Live Demos` with actual Cloud Run URL.
  - Add `## Run & Try (Next.js)` with env table; note client calls relative routes and server handlers perform API calls.
- Capture screenshots of Loading → Data on `/posts`; add to Packet assets path and ensure upload.

Evidence hooks
- Cloud Run URL echoed in job summary; README section diffs; screenshots attached to Packet.

### Phase 3 (PR 3): A11y smokes + Client-side contract checks in CI
Maps: FR-010, FR-011, FR-012, FR-013, FR-003 (artifacts), FR-017

Checklist
- A11y scope: pages `/` and `/posts`. Ensure at least one labeled control, keyboard-only primary action path, and status announcements via `aria-live` or `role="status"`.
- Implement Playwright tests using `@axe-core/playwright`; ensure reports and any screenshots upload into Review Packet.
- Client contract checks:
  - Define shared types in `C:\Users\LENOVO\Training\frontend-next\src\lib\types\api.ts`.
  - Success path: validate fields used by UI: `id`, `title`, `body`, `timestamps`.
  - Error path: validate `{ "error": { "code": number, "message": string } }` envelope for 400/404.
  - Fail CI on drift; summarize results to job summary.
- Keep PR focused on tests and CI plumbing; no unrelated refactors.

Evidence hooks
- Playwright a11y report(s) artifact; contract check summary in job summary and included in Packet.

### Phase 4 (PR 4): Governance cleanup & release tagging
Maps: FR-014, FR-015, FR-016, FR-017

Checklist
- Ensure Linear and spec→Linear checks run only in private repo; mirror is publish-only (no PR checks). Adjust workflow `on:` filters and repo permissions as needed.
- Remove/disable failing or legacy workflows that are not the quality-gate or review-packet workflows.
- Tag `v6.0.0` with release notes including links to: this spec, Linear issue, Quality Gate run, Review Packet, and Cloud Run demo URL.
- Confirm Actions dashboard is green with no red noise on `main`.

Evidence hooks
- Release notes URL; screenshot of Actions dashboard (all green); proof of mirror governance.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\research.md` with clarifications (provided) and decisions captured.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\data-model.md`, `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\contracts\*`, failing tests, `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\quickstart.md`, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\tasks.md`

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
