# Quickstart: Week 6 – Finish-to-Green

## Prerequisites
- Node.js and npm installed
- API available (Cloud Run) with posts endpoint

## Configure Environment
 - Local (`frontend-next/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   # Optional for local SSR:
   # API_BASE_URL=http://localhost:8080
   ```
 - Live (Cloud Run): set `API_BASE_URL` on the `maximus-training-frontend` service via Console → Service → Variables & Secrets.

> Important: `API_BASE_URL` is a required server-side variable for the initial server-rendered page load of `/posts`. If it is missing or incorrect in the live environment, the first paint may not contain posts and will rely on client-side fetching instead.
## Run Locally
- In `frontend-next/`: install deps and start dev server
  - `npm install`
  - `npm run dev`
- Open `/posts` and ensure first paint includes post items in initial HTML (inspect source).

## Verify
- README links resolve to working Cloud Run URLs
- `/posts` renders SSR posts without a persistent "Loading..." state
- CI shows a labeled "frontend-next Coverage (with thresholds)" block and downloadable HTML artifacts
