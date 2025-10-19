# Quickstart: Week 7.5 Finish‑to‑Green

## Run tests with coverage
- From repo root:
```bash
cd frontend-next
npm ci
npm run test:ci
```
- Outputs: `frontend-next/coverage/{coverage-summary.json, lcov.info, html/}`
- Expectation: Local summary shows non‑zero totals for statements and lines (V8 provider).

## Generate Review Packet artifacts
- Accessibility HTML (browsable):
```bash
cd frontend-next
npm run test:e2e
```
  - Output: `docs/ReviewPacket/a11y/html/index.html` (artifact name: `a11y-frontend-next`)

- API contract lint (JSON report):
```bash
# run from repo root
npx spectral lint api/openapi.json -f json > contract/report.json
```
  - Output: `contract/report.json` (artifact name: `contract-api`)

## Deploy and verify
- Push to the default branch to trigger deploy
- Confirm job summary includes the pipeline run link and the live service URL
- Open README links to verify accuracy (no placeholders)

## Release
- Tag and publish release with evidence links:
```bash
git tag v7.0.x
git push origin v7.0.x
```
- Verify links resolve to the Quality Gate, Review Packet, live demo, and spec
