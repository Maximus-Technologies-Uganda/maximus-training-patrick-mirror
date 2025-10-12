# Data Model: Week 6 – Finish-to-Green

**Created**: 2025-10-12  
**Feature**: ../spec.md

## Entities

### Post
- Purpose: An item displayed on `/posts` in first paint SSR
- Key fields: `id`, `title`, `body`
- Notes: Rendered as list items in server-rendered HTML

### OpenAPI Operation
- Purpose: A documented API endpoint contract
- Key fields: `operationId`, `summary/description`, `tags`, `responses`
- Error model: references shared 4xx error schema

### Error (ClientVisible4xx)
- Purpose: Standardized error payload for 4xx responses
- Fields: `code` (string), `message` (string), `details` (object, optional)

### CI Evidence Artifact
- Purpose: Evidence produced by CI runs
- Types: `coverage-frontend-next` HTML report, Playwright HTML report
- Attributes: `name`, `type`, `location`

### Release
- Purpose: Milestone artifact (`v6.0.0`) with links to evidence
- Fields: `version`, `notes`, `links[]` (spec, Quality Gate, Review Packet, demo)
