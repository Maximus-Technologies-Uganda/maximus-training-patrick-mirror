
# Implementation Plan: Finish-to-Green for frontend-next (Week 6)

**Branch**: `spec/week-6-finish-to-green` | **Date**: 2025-10-10 | **Spec**: specs/spec/week-6-finish-to-green/spec.md
**Input**: C:\Users\LENOVO\Training\specs\spec\week-6-finish-to-green\spec.md

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
Deliver a five-phase plan to bring `frontend-next` to green:
1) Fix data fetching via a server-handled relative endpoint so the client avoids public base URLs; 2) Update README with live Cloud Run URLs and a Run & Try section; 3) Surface CI evidence (coverage block, Playwright report, deployment URL) in job summaries and artifacts; 4) Upload a11y and contract test artifacts and print concise summaries; 5) Tag v6.0.0 with links to spec, Linear issue, a green CI run, and the live demo.

## Technical Context
**Language/Version**: TypeScript (Node 18+)  
**Primary Dependencies**: Next.js (App Router), Playwright, Vitest  
**Storage**: N/A  
**Testing**: Playwright E2E, Vitest unit/component  
**Target Platform**: Google Cloud Run (frontend and API)
**Project Type**: web  
**Performance Goals**: Posts visible ≤ 3s after initial paint  
**Constraints**: No indefinite loaders; server-handled fetch; CI evidence printed and uploaded  
**Scale/Scope**: Week-6 finish-to-green scope (docs, CI evidence, release)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Outcomes Over Output: Success measured by live demo rendering posts and CI evidence discoverability.
- Simplicity and Clarity: Use server-side proxy to remove client base-URL complexity.
- Security and Privacy: No secrets in client; server-to-server fetch uses backend URL from config.
- Reliability and Performance: Add timeouts/retry(1) and error states to avoid infinite loaders.
- Test-Driven Quality: Update Playwright to assert posts render and evidence artifacts generated.
- Observability and Operability: CI job summaries include actionable links; artifacts uploaded.

Status: Initial Constitution Check PASS; Post-Design Constitution Check PASS.

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

**Structure Decision**: Option 2 (Web application): `frontend-next` (client and proxy route), `api` (existing backend)

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

**Output**: research.md with all NEEDS CLARIFICATION resolved

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

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Five-Phase PR Plan (Sequential)

### Phase 1 — Fix Data Fetching (Blocking)
- Add server route handler `frontend-next/src/app/api/posts/route.ts` to proxy GET to the API Cloud Run URL.
- Switch client data fetch to `"/api/posts"`; remove reliance on `NEXT_PUBLIC_API_URL` for posts.
- Implement error and empty states; add a single retry with timeout.
- Add integration/E2E assertion: posts list renders; loader clears.
- Verify on Cloud Run deployment: 200 from `"/api/posts"` and posts visible.

### Phase 2 — Update README and Documentation
- Replace placeholders with live URLs:
  - Frontend: `https://maximus-training-frontend-673209018655.africa-south1.run.app`
  - API: `https://maximus-training-api-673209018655.africa-south1.run.app`
- Add "Run & Try" with env var table (local vs production) and steps.
- Link to CI evidence section and live demo.

### Phase 3 — Audit and Surface CI Evidence
- Print a distinct `frontend-next` coverage block to `$GITHUB_STEP_SUMMARY` in Quality Gate.
- Upload artifacts: `coverage-frontend-next` and Playwright report.
- Add live Cloud Run frontend URL to deployment job summary.
- Ensure Review Packet includes coverage and Playwright artifacts.

### Phase 4 — Surface A11y and Contract Test Artifacts
- Upload Playwright a11y reports as artifacts; include concise pass/fail in Quality Gate summary.
- Generate/upload contract test summaries; link artifacts in summary.

### Phase 5 — Tag the Final Release
- Create tag `v6.0.0` and push.
- Draft release notes linking: spec, Linear issue, green CI run, live demo URL.
- Publish release; verify links and evidence.

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

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved (pending Linear issue link)
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
