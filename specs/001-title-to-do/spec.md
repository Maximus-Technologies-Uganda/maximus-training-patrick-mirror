# Feature Specification: To-Do Mini Project (Week 4)

**Feature Branch**: `001-title-to-do`  
**Created**: 2025-09-15  
**Status**: Draft  
**Input**: User description: "Title: To-Do Mini Project (Week 4)\nProblem & Goal\nBuild a durable, accessible To-Do app with deterministic core logic and a thin DOM layer. \nThe goal is a production-shaped slice: spec-first delivery, per-module coverage thresholds \nenforced in CI, a11y checks, and a live Pages demo linked from README.\nScope\nIn-scope: create/toggle/delete; search; priority (low/med/high); due types \n(today/tomorrow/overdue); CSV export; LocalStorage persistence; a11y \n(labels/focus/contrast).\nOut-of-scope: auth, network sync, multi-user, server APIs.\nInterfaces\n type Todo = { id:string, title:string, due:Date|null, priority:'low'|'med'|'high', \ndone:boolean }\n Core (pure):\no add(state:Todo[], input:{title:string, due:Date|null, priority?:'low'|'med'|'high'}, \ndeps:{idgen:()=>string, clock:()=>Date}):Todo[]\no toggle(state:Todo[], id:string):Todo[]\no remove(state:Todo[], id:string):Todo[]\no filter(state:Todo[], q:{text?:string, dueType?:'today'|'tomorrow'|'overdue'|'all', \npriority?:'low'|'med'|'high'|'all'}):Todo[]\no exportCsv(state:Todo[]):string\no serialize(state:Todo[]):string / deserialize(raw:string):Todo[]\n Storage adapter (impure but isolated):\no storage.load():string|null\no storage.save(raw:string):void\nAcceptance Checks (must be proven in CI)\n Coverage: frontend/src/todo-core*.{js,ts} 55% statements; no UI module < 40%\nstatements.\n Branch/Function lift: +10pp combined vs Week-3 baseline (measured in Review \nPacket).\n Playwright: happy-path (addtoggledelete), due-today filter works, CSV \ndownload link exists.\n A11y: labeled controls; predictable focus after add/toggle/delete; AA contrast for \nbuttons/links.\n Pages: demo updated; README links to Pages and Coverage Index. (Default Pages \nURL likely: https://Maximus-Technologies-Uganda.github.io/maximus-training-patrick-mirror/).\nRisks & Rollback\n Risk: LocalStorage corruption  Fallback: ignore bad JSON, show empty list with \ntoast.\n Risk: Flaky time-based tests  Mitigation: inject clock(); use fake timers.\n Risk: Coverage gate path drift  Mitigation: pin single JSON path; echo totals in job \nsummary.\nTest Plan\n Table-driven unit cases for: duplicate title guard; due-type boundaries using a fake \nclock; CSV golden (normalized newlines); empty title validation; long titles; \nremove/toggle unknown ID is no-op.\n UI helper tests for formatting & DOM guards; Playwright smokes as above.\nMilestones\nD1 Spec merged; D2 core + tests; D3 UI + a11y; D4 storage + hardening; D5 polish + \nrelease."

---

##  Quick Guidelines
-  Focus on WHAT users need and WHY
-  Avoid HOW to implement (no tech stack, APIs, code structure)
-  Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A user wants to track personal tasks. They can add a task with an optional due date and priority, quickly find tasks by text/priority/due-type, mark tasks complete, and remove tasks. The list persists locally between visits and can be exported to CSV for backup or sharing.

### Acceptance Scenarios
1. **Given** an empty list, **When** the user adds a task with title "Pay rent" due today and priority high, **Then** the task appears with correct attributes and focus moves to the new task's title.
2. **Given** a list with multiple tasks, **When** the user types "rent" in search and selects due type "today", **Then** only tasks matching text and due today are shown.
3. **Given** a task in the list, **When** the user toggles it complete, **Then** the task visually reflects completion and focus predictably moves to the next actionable control.
4. **Given** a task in the list, **When** the user deletes it, **Then** the task is removed and focus shifts to the nearest sensible control (next task or add field) without trapping.
5. **Given** a non-empty list, **When** the user clicks "Export CSV", **Then** a CSV download is initiated and the content matches a stable header and normalized newlines.

### Edge Cases
- Adding a task with an empty or whitespace-only title is rejected with a clear, accessible error.
- Adding a duplicate title prompts a confirmation or rejects (decision: reject duplicates to keep spec deterministic).
- Toggling/removing an unknown id is a no-op.
- Due-type boundaries follow the injected clock's day cutoffs to avoid flakiness (e.g., "today" ends at 23:59:59 of clock's day).
- Deserialization of corrupted LocalStorage results in an empty list with a non-blocking notice.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Users MUST add a task with title (required), optional due date, and priority (default medium if omitted).
- **FR-002**: Users MUST toggle a task's completion state.
- **FR-003**: Users MUST delete a task.
- **FR-004**: Users MUST filter tasks by free-text, by due type (today/tomorrow/overdue/all), and by priority (low/med/high/all) with combinable criteria.
- **FR-005**: Users MUST export the current list to CSV with a stable header order and normalized line endings (\n).
- **FR-006**: The system MUST persist the list in LocalStorage and load it on start; corrupted JSON MUST be ignored safely.
- **FR-007**: The UI MUST be accessible: labeled controls, predictable focus after add/toggle/delete, and AA contrast for interactive elements.

- **FR-008**: Coverage MUST meet: `frontend/src/todo-core*.{js,ts}`  55% statements; no UI module < 40% statements.
- **FR-009**: Combined branch+function coverage MUST increase by 10 percentage points vs Week3 baseline (as measured in Review Packet).
- **FR-010**: E2E MUST pass: happy-path addtoggledelete; due-today filter; CSV link exists.
- **FR-011**: Pages demo MUST be updated; README MUST link to Pages and Coverage Index.

### Key Entities *(include if feature involves data)*
- **Todo**: Represents a task item with fields: `id`, `title`, `due` (date or null), `priority` (low|med|high), `done` (boolean).
- **Filters**: Represents the current view query with fields: `text?`, `dueType?` (today|tomorrow|overdue|all), `priority?` (low|med|high|all).

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
