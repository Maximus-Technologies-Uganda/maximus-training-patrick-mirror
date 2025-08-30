## Final Handoff (Week 1)

### Repos / PRs / Tags
- Primary repo: `Maximus-Technologies-Uganda/Training`
- Mirror (owner-managed): `Maximus-Technologies-Uganda/maximus-training-patrick-mirror`
- Example PRs:
  - feature: `feat/add-author-filter-to-quote-cli`
  - fix: `fix/typo-in-expense-readme`
  - tests: `test/add-missing-total-test`
  - CI: `ci/fix-mirror-workflow`
- Tags:
  - `v2.1.0` – Week 1 stretch complete
  - `v2.2.0` – Quote CLI implemented

### Test output snapshots (updated)
- Quote CLI: all green (4 passed)
- Todo CLI: all green
- Stopwatch CLI: all green
- Expense CLI: 1 failure (total command without flags) + other tests passing. This is intentional to surface missing implementation.

### CLI screenshots/GIFs
- See `docs/` directory (to be attached in PR description)

### Fundamentals notes + Labs
See `docs/fundamentals-notes.md` and `/labs` snippets.

### Short Retro (300–400 words)
Root causes: Early ambiguity on data formats (JSON, newline handling) and platform differences (PowerShell piping, CRLF vs LF) caused intermittent test failures. We addressed JSON BOM issues and ensured parsers strip BOM before parsing. Another friction area was Git workflows: pushing non-fast-forward required explicit rebase, and tag annotations needed force-pushing when retagging messages. CI surfaced YAML lint constraints; we simplified the workflow and removed duplicate blocks, using block scalars for shell steps and avoiding context in job-level conditions. For CLI UX, we added consistent error messages and exit codes, making tests deterministic. The expense CLI lacks full implementation for the `total` command; the new test made that gap visible, which is good—tests now drive the missing feature.

What I’ll change next week: Prioritize defining contract tests first (I/O shapes, error codes, file locations) to reduce ambiguity. Adopt a strict cross-platform test runner wrapper to normalize output and line endings (and avoid piping pitfalls on Windows). For Git, I’ll standardize branch policies (always rebase before push) and use conventional commits with `changesets` to automate versioning and changelogs. CI: move secrets checks into steps, not job-level expressions; add a dry-run job to validate YAML and shell. For CLIs, introduce argument validation helpers and shared I/O utilities to reduce duplication. I’ll also add unit tests for helpers and integrate code coverage. Lastly, I’ll document runbooks for tagging, branching, and CI secrets to reduce friction for future contributors.


