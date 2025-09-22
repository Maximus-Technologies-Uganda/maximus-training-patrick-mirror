---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

Given the context provided as an argument, do this (produce TWO outputs in the feature directory):
1) A fully generated `tasks.md`
2) A corresponding `linear.yml` derived from `tasks.md` using `.specify/templates/linear-template.yml` as the base

1. Run `.specify/scripts/powershell/check-task-prerequisites.ps1 -Json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.
2. Load and analyze available design documents:
   - Always read plan.md for tech stack and libraries
   - IF EXISTS: Read data-model.md for entities
   - IF EXISTS: Read contracts/ for API endpoints
   - IF EXISTS: Read research.md for technical decisions
   - IF EXISTS: Read quickstart.md for test scenarios

   Note: Not all projects have all documents. For example:
   - CLI tools might not have contracts/
   - Simple libraries might not need data-model.md
   - Generate tasks based on what's available

3. Generate tasks following the template:
   - Use `.specify/templates/tasks-template.md` as the base
   - Replace example tasks with actual tasks based on:
     * **Setup tasks**: Project init, dependencies, linting
     * **Test tasks [P]**: One per contract, one per integration scenario
     * **Core tasks**: One per entity, service, CLI command, endpoint
     * **Integration tasks**: DB connections, middleware, logging
     * **Polish tasks [P]**: Unit tests, performance, docs

4. Task generation rules:
   - Each contract file → contract test task marked [P]
   - Each entity in data-model → model creation task marked [P]
   - Each endpoint → implementation task (not parallel if shared files)
   - Each user story → integration test marked [P]
   - Different files = can be parallel [P]
   - Same file = sequential (no [P])

5. Order tasks by dependencies:
   - Setup before everything
   - Tests before implementation (TDD)
   - Models before services
   - Services before endpoints
   - Core before integration
   - Everything before polish

6. Include parallel execution examples:
   - Group [P] tasks that can run together
   - Show actual Task agent commands

7. Create FEATURE_DIR/tasks.md with:
   - Correct feature name from implementation plan
   - Numbered tasks (T001, T002, etc.)
   - Clear file paths for each task
   - Dependency notes
   - Parallel execution guidance

8. Create or update FEATURE_DIR/linear.yml with:
   - Use `.specify/templates/linear-template.yml` as the base if the file does not exist
   - Keep `parentIssueId: null` (do NOT attempt to populate)
   - Under `tasks:`, add one list item per task title from tasks.md
     - If a task contains an ID prefix like `T001`, keep it in the title as-is
     - Items may be plain strings (titles) or objects with the shape `{ title: "..." }`
   - Preserve any existing `issueId` values when updating (match by exact title)

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.
