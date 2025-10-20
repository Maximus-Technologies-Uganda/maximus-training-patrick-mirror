# Production Deployment (Google Cloud Run)

_Last updated: TODO-YYYY-MM-DD_

## 0) Prerequisites
- Node 20 + pnpm 9
- GCP project with Artifact Registry + Cloud Run enabled
- GitHub Actions → **Workload Identity Federation** (recommended), or a service account key in Secrets
- Neon (PostgreSQL) production database and URL
- CI green with required artifacts (see `DEVELOPMENT_RULES.md`)

## 1) Required environment variables

| Key                         | Scope | Notes |
|----------------------------|-------|-------|
| NODE_ENV=production        | all   | Required |
| DATABASE_URL               | all   | Neon prod connection |
| SESSION_SECRET             | all   | 32+ chars |
| GCP_PROJECT_ID             | deploy| e.g., `proj-rms-prod` |
| GCP_REGION                 | deploy| e.g., `africa-south1` |
| VERTEX_LOCATION            | API   | `us-central1` |
| VERTEX_MODEL               | API   | `gemini-2.5-flash` |
| ASSISTANT_ENABLED          | API   | `true` |
| VITE_ASSISTANT_ENABLED     | FE    | build-time flag |
| ASSISTANT_FORWARDING_SECRET| FE/API| HMAC secret |
| ASSISTANT_CORS_ORIGINS     | FE    | CSV of allowed origins |

> Store secrets in **GitHub Actions → Secrets and variables** or **Secret Manager**. Prefer WIF to avoid JSON keys.

## 2) Build
```bash
pnpm install
pnpm -r build

3) Build & push images (two common paths)
A) Cloud Build (recommended)
gcloud builds submit --config cloudbuild.yaml --project "$GCP_PROJECT_ID"

B) Docker buildx (direct)
# Auth and repo (once)
gcloud auth configure-docker $GCP_REGION-docker.pkg.dev

# API
docker buildx build -t $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/app/api:$(git rev-parse --short HEAD) -f api/Dockerfile .
docker push $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/app/api:$(git rev-parse --short HEAD)

# Frontend
docker buildx build -t $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/app/frontend:$(git rev-parse --short HEAD) -f frontend-next/Dockerfile .
docker push $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/app/frontend:$(git rev-parse --short HEAD)

4) Deploy to Cloud Run
API
gcloud run deploy api \
  --image=$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/app/api:$(git rev-parse --short HEAD) \
  --region=$GCP_REGION \
  --platform=managed \
  --allow-unauthenticated=false \
  --port=8080 \
  --set-env-vars=NODE_ENV=production,ASSISTANT_ENABLED=true,VERTEX_LOCATION=us-central1,VERTEX_MODEL=gemini-2.5-flash \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest

Frontend (Next.js)
gcloud run deploy frontend \
  --image=$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/app/frontend:$(git rev-parse --short HEAD) \
  --region=$GCP_REGION \
  --platform=managed \
  --allow-unauthenticated=true \
  --port=8080 \
  --set-env-vars=NODE_ENV=production,VITE_ASSISTANT_ENABLED=true,ASSISTANT_CORS_ORIGINS=$ASSISTANT_CORS_ORIGINS

Wire frontend → API (private API)
# Allow frontend service account to invoke API
gcloud run services add-iam-policy-binding api \
  --member="serviceAccount:FRONTEND_SA@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=$GCP_REGION


Supply the API base URL to the frontend at build/runtime per your app’s config (e.g., API_BASE_URL server-only, NEXT_PUBLIC_API_URL for client).

5) Post-deploy checks (Gate alignment)

SSR first paint present (HTML contains expected content)

Performance within LCP/TTFB budgets

CSP: includes script-src 'self' and style-src 'self'; no unsafe-inline, no localhost

Contract matches api/openapi.json

Org isolation sanity checks pass

6) Smoke examples
FRONTEND_URL="https://<frontend-service>-<hash>-<region>.run.app"
API_URL="https://<api-service>-<hash>-<region>.run.app"

curl -sSf "$FRONTEND_URL/posts" | head
curl -sSf "$API_URL/posts" | jq .

7) Rollback
# List revisions
gcloud run revisions list --service api --region $GCP_REGION
# Roll back by traffic split
gcloud run services update-traffic api --to-revisions <REVISION>=100 --region $GCP_REGION

