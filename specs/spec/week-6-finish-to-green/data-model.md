# Data Model — Finish-to-Green (Week 6)

## Entities

### Post
- id: string | number
- title: string
- body: string

### EvidenceArtifact
- name: string (e.g., coverage-frontend-next, playwright-report)
- path: string
- type: enum [coverage, e2e, a11y, contract]

### LiveDeployment
- url: string (frontend Cloud Run URL)
- apiUrl: string (API Cloud Run URL)

### Release
- version: string (e.g., v6.0.0)
- notesUrl: string
- links: { spec: string, linear: string, ciRun: string, demo: string }
