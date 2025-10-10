# Quickstart — Finish-to-Green (Week 6)

## Local
1. Open `frontend-next`
2. Install deps: `npm ci`
3. Run: `npm run dev`
4. Visit: `http://localhost:3000`

Environment (local example):
- API_CLOUD_RUN_URL: `https://maximus-training-api-673209018655.africa-south1.run.app`

## Production (Cloud Run)
- Frontend: `https://maximus-training-frontend-673209018655.africa-south1.run.app`
- API: `https://maximus-training-api-673209018655.africa-south1.run.app`

## Verify
- Home renders posts (no infinite loader)
- Network shows 200 from `GET /api/posts`
- CI job summaries include coverage, Playwright, and deployment URL
