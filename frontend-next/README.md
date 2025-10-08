This is a [Next.js](https://nextjs.org) application configured for SSR on Cloud Run with server Route Handlers.

## Live Demos

- Production (Cloud Run, `africa-south1`): [Update after deploy – URL appears in Actions job summary]

## Run & Try (Next.js)

The browser makes calls to relative routes like `/api/posts`. Server Route Handlers proxy these calls to the upstream API using server-only configuration—no secrets are exposed to the client.

### Environment

| Variable | Scope | Example | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Local dev and SSR fallback | `http://localhost:3000` | Base URL for the API when running locally; also used by SSR if `API_BASE_URL` is not set. |
| `API_BASE_URL` | Server-only (Cloud Run) | `https://maximus-training-api-xxxxx-africa-south1.run.app` | Upstream API base URL used by server Route Handlers. |
| `API_SERVICE_TOKEN` | Server-only (optional) | `eyJ...` | Optional bearer token sent as `Authorization: Bearer <token>` for service-to-service calls. |
| `PORT` | Runtime (container) | `8080` | Provided by Cloud Run; the app binds to this port. |

### Local Development

1. Start the API (in another terminal):
   ```bash
   # from repo root
   npm --workspace api run dev
   # API listens on http://localhost:3000 by default
   ```
2. Start the frontend:
   ```bash
   # from repo root or ./frontend-next
   cd frontend-next
   set NEXT_PUBLIC_API_URL=http://localhost:3000 # PowerShell
   # or: export NEXT_PUBLIC_API_URL=http://localhost:3000 (bash)
   npm run dev
   ```
3. Visit http://localhost:3000/posts

### Build & Deploy (Cloud Run)

- GitHub Actions workflow: `.github/workflows/deploy-cloud-run.yml`
  - Trigger: push to `main`
  - Submits `cloudbuild.yaml` which:
    - Builds and pushes images to Artifact Registry
    - Deploys `maximus-training-frontend` in `africa-south1` with `min-instances=1`
    - Sets `API_BASE_URL` and binds to port `8080`
  - The job writes the Cloud Run service URL to the GitHub Job Summary

### Next.js Configuration

`next.config.ts` (SSR + standalone for Cloud Run):

```ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
```

### API Contracts

- `../api/openapi.json`
