# Quickstart: Week 6 – Finish-to-Green

## Prerequisites
- Node.js and npm installed
- API available (Cloud Run) with posts endpoint

## Configure Environment
- Set `API_BASE_URL` locally (example):
  - Windows PowerShell: `$env:API_BASE_URL='https://<your-api-domain>'`
  - macOS/Linux: `export API_BASE_URL='https://<your-api-domain>'`
- In Cloud Run (live), set `API_BASE_URL` on the `maximus-training-frontend` service via Console → Service → Variables & Secrets.

## Run Locally
- In `frontend-next/`: install deps and start dev server
  - `npm install`
  - `npm run dev`
- Open `/posts` and ensure first paint includes post items in initial HTML (inspect source).

## Verify
- README links resolve to working Cloud Run URLs
- `/posts` renders SSR posts without a persistent "Loading..." state
- CI shows labeled "frontend-next Coverage" block and downloadable HTML artifacts
