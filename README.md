# Training

[![Review Packet](https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/review-packet.yml/badge.svg)](https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/review-packet.yml)

Monorepo containing multiple small apps and exercises (`quote/`, `expense/`, `stopwatch/`, `todo/`, `frontend/`, and more).

## Quickstart

Prerequisites:

- Node.js 18+
- Git

From the repo root:

```bash
# install root tools and run the monorepo test runner
npm ci
npm test
```

Frontend (unit tests with coverage):

```bash
cd frontend
npm ci
npm run test:run -- --coverage
```

## Live Preview

Deployed via GitHub Pages from `frontend/dist` on `main`.

- Live site: https://maximus-technologies-uganda.github.io/maximus-training-patrick-mirror/

Local development server:

```bash
cd frontend
npm ci
npm run dev
```

## Coverage Index

- CI posts a coverage summary for the frontend to the PR job summary and comments.
- The full HTML coverage report is bundled in the "Review Packet" artifact from CI runs. Download the artifact from a run of the Review Packet workflow and open the coverage report inside (e.g., `frontend/coverage/lcov-report/index.html`).
- Raw summary JSON path in CI: `frontend/coverage/coverage-summary.json`.

Local HTML report for the frontend:

```bash
cd frontend
npm run test:run -- --coverage
# then open coverage/lcov-report/index.html
```

Each package (`quote/`, `expense/`, `stopwatch/`, `todo/`) also produces coverage when running tests within that package.
