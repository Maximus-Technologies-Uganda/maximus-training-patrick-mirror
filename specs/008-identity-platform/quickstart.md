chore/T001-env-flags-setup-DEV-598
﻿# Quickstart - Week 8 Identity Platform

## Prerequisites
- Node 20.x LTS, pnpm 9.x
- Firebase project (for Authentication)
- Environment variables configured (see tables below)

## Environment Variables

### Frontend (frontend-next)

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `NEXT_PUBLIC_API_URL` | Yes | none | `http://localhost:3000` | Browser base URL for API calls |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | none | `AIza...` | Firebase Web SDK API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | none | `proj.firebaseapp.com` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | none | `my-project` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | none | `1:123...` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | none | `123456789` | Optional: FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | none | `proj.appspot.com` | Optional: Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | none | `G-ABC123` | Optional: Analytics ID |
| `API_BASE_URL` | No | fallback to NEXT_PUBLIC_API_URL | `http://localhost:3000` | Server-side SSR/BFF base URL |
| `API_SERVICE_TOKEN` | No | none | `service-token` | Optional: Service-to-service auth |

### API (api)

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `PORT` | No | `3000` | `3000` | API server port |
| `SESSION_SECRET` | **Yes in prod** | none | `32+ random chars` | Fails startup in production if missing; ≥32 chars |
| `READ_ONLY` | No | `false` | `false` | Enable read-only mode (returns 503 on writes) |
| `IDENTITY_ENABLED` | No | `true` | `true` | Enable identity/auth features |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | `60000` | Rate limit window (milliseconds) |
| `RATE_LIMIT_MAX` | No | `10` | `10` | Max requests per window per user/IP |
| `ALLOW_ORIGIN` | **Yes for CORS** | `http://localhost:3001` | `http://localhost:3001,https://staging.app.com` | CSV without spaces; exact origins only when credentials=true |
| `ALLOW_CREDENTIALS` | No | `false` | `false` | Must not be `true` with wildcard `*` origin (enforced at startup) |
| `FIREBASE_ADMIN_PROJECT_ID` | No* | none | `my-project` | *Required if using Firebase Admin SDK |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | No* | none | `firebase-adminsdk@...` | *Required if using Firebase Admin SDK |
| `FIREBASE_ADMIN_PRIVATE_KEY` | No* | none | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` | *Required; escape newlines as `\n` and wrap in quotes |
| `HEALTHCHECK_FIREBASE_ADMIN_PING` | No | `true` | `false` | Set to `false` locally when Firebase Admin credentials are absent or when using emulators to avoid 503 noise |

**Note on Secret Manager (Production):**
In production, `SESSION_SECRET` and Firebase Admin credentials should be loaded from Google Secret Manager, not committed. See T045 for Secret Manager wiring documentation.
Rotate Firebase Admin service-account keys at least every 90 days: create a new key in Secret Manager, deploy with the new version, then revoke the previous key once rollout completes. Document the rotation date in the runbook (see §7 below).

## Setup Instructions

### 1. Install Dependencies

```bash
# Enable Corepack (one-time setup)
corepack enable && corepack prepare pnpm@9.x --activate

# Install all workspace dependencies
pnpm install
```

### 2. Copy Environment Templates

**Unix/Mac/WSL:**
```bash
cp frontend-next/.env.example frontend-next/.env.local
cp api/.env.example api/.env
```

**Windows (PowerShell/CMD):**
```powershell
copy frontend-next\.env.example frontend-next\.env.local
copy api\.env.example api\.env
```

### 3. Configure Environment Files

Edit the copied files and fill in your Firebase credentials and other required values:

- **`frontend-next/.env.local`**: Add your Firebase Web SDK config from Firebase Console → Project Settings → General
- **`api/.env`**:
  - Set a strong `SESSION_SECRET` (≥32 random characters) for local dev
  - Add Firebase Admin credentials (download service account JSON from Firebase Console → Project Settings → Service Accounts)
  - Configure `ALLOW_ORIGIN` to match your frontend URL (default: `http://localhost:3001`)

**Important:** Ensure `FIREBASE_ADMIN_PRIVATE_KEY` newlines are escaped as `\n` and the value is wrapped in quotes:
```dotenv
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### 4. Development Ports

- **API**: Runs on port `3000` (configurable via `PORT`)
- **Frontend**: Runs on port `3001` (via `pnpm --filter frontend-next dev`)

The `frontend-next/package.json` dev script is configured to use `-p 3001` by default.

### 5. CORS Configuration

The `ALLOW_ORIGIN` variable accepts a **CSV list without spaces**:
```dotenv
ALLOW_ORIGIN=http://localhost:3001,https://staging.example.com,https://prod.example.com
```

**Critical rules (enforced by T095/T103):**
- If `ALLOW_CREDENTIALS=true`, origins must be exact (never `*`)
- Production startup will fail if `ALLOW_CREDENTIALS=true` and `ALLOW_ORIGIN='*'`

### 6. Secret Hygiene & Gitleaks

- All `.env*` files are ignored by git (except `.env.example` files)
- A `.gitleaks.toml` allowlist rule permits the fake private key placeholder in example files
- Run `npx gitleaks detect` to verify no secrets are committed

**CI Integration:** The gitleaks check runs on every PR (see T055).

### 7. Firebase Admin IAM (Least Privilege)

- Create a dedicated service account (e.g., `firebase-admin-bff@<project>.iam.gserviceaccount.com`) for the BFF/API tier.
- Grant only the roles required for token verification and revocation:
  - `Firebase Authentication Admin` (`roles/firebaseauth.admin`) — verify ID tokens, revoke sessions, inspect disabled users.
  - `Service Account Token Creator` (`roles/iam.serviceAccountTokenCreator`) — optional, only if you mint custom tokens (not required for standard email/password flows).
- Remove broad roles such as `Editor` from the service account and store the JSON key in Secret Manager (`FIREBASE_ADMIN_*` secrets).
- Document the account email in deployment runbooks so rotations can be audited. See [plan.md](./plan.md#firebase-admin-iam) for the release checklist that references this section.
- Rotate the service account key at most every 90 days: (1) add a new key in Secret Manager as a new secret version, (2) deploy staging/production with the new version, (3) confirm `/health` stays green, then (4) revoke the prior key in the Firebase Console.

### 8. Firebase Emulators (Optional, Local Dev)

For local development without hitting Firebase production:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators  # Select Auth, Firestore

# Start emulators
firebase emulators:start
```

**Point SDKs to emulators** (add to `.env.local` / `.env`):
```dotenv
# Frontend (.env.local)
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# API (.env)
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
```

**Runtime wiring:**

- The API honours `FIREBASE_AUTH_EMULATOR_HOST`/`FIREBASE_FIRESTORE_EMULATOR_HOST` automatically; set them before `pnpm --filter api dev` to route Firebase Admin traffic to the emulator.
- The Next.js client calls `connectAuthEmulator` when `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` is defined. Provide the host without a scheme (e.g., `localhost:9099`) to match Firebase CLI defaults.
- Keep emulator credentials scoped to your local project; never reuse production secrets.

**Verify emulator wiring:**

1. Export the emulator vars and disable the Firebase Admin health ping before starting the API:

   ```bash
   export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   export FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
   export HEALTHCHECK_FIREBASE_ADMIN_PING=false
   pnpm --filter api dev
   ```

2. In another terminal, create a test account via the Firebase CLI (emulator only):

   ```bash
   firebase auth:import emulator-users.json --project your-project-id
   ```

   `emulator-users.json` can contain seed credentials for smoke testing.

3. Hit the API health endpoint and confirm the dependency status reports `firebase: "ok"` even when credentials are not present (because the emulator host short-circuits the admin ping):

   ```bash
   curl -s http://localhost:3000/health | jq '.dependencies'
   ```

4. Start the frontend with `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`, sign in using the seeded credentials, and verify the login succeeds without contacting production Firebase (inspect the network tab; calls should target `http://localhost:9099`).

See T072 for full emulator parity documentation.

### 9. Google Secret Manager (Production)

For production deployments, sensitive credentials should be stored in Google Secret Manager instead of environment files.

**Creating Secrets:**

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create SESSION_SECRET
openssl rand -base64 32 | gcloud secrets create SESSION_SECRET --data-file=-

# Create Firebase Admin credentials (from downloaded service account JSON)
gcloud secrets create FIREBASE_ADMIN_PROJECT_ID --data-file=- <<< "your-project-id"
gcloud secrets create FIREBASE_ADMIN_CLIENT_EMAIL --data-file=- <<< "firebase-adminsdk@your-project.iam.gserviceaccount.com"

# For private key, extract from service account JSON and escape newlines
cat service-account.json | jq -r '.private_key' | gcloud secrets create FIREBASE_ADMIN_PRIVATE_KEY --data-file=-
```

**Granting Access:**

```bash
# Option 1: Service Account (Cloud Run)

# Recommended: Create a dedicated service account (better security & auditing)
gcloud iam service-accounts create api-service \
  --display-name="API Service Account" \
  --description="Dedicated service account for API with Secret Manager access"

SERVICE_ACCOUNT="api-service@YOUR_PROJECT_ID.iam.gserviceaccount.com"

# Alternative: Use default Compute Engine service account (not recommended for production)
# PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='get(projectNumber)')
# SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding SESSION_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FIREBASE_ADMIN_PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FIREBASE_ADMIN_CLIENT_EMAIL \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FIREBASE_ADMIN_PRIVATE_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Option 2: Workload Identity (GKE, preferred)
gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT} \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:YOUR_PROJECT_ID.svc.id.goog[NAMESPACE/KSA_NAME]"
```

**Wiring to Cloud Run:**

```bash
# Deploy with dedicated service account (recommended)
gcloud run deploy api \
  --image gcr.io/YOUR_PROJECT_ID/api:latest \
  --platform managed \
  --region africa-south1 \
  --service-account="api-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --set-secrets="SESSION_SECRET=SESSION_SECRET:latest,FIREBASE_ADMIN_PROJECT_ID=FIREBASE_ADMIN_PROJECT_ID:latest,FIREBASE_ADMIN_CLIENT_EMAIL=FIREBASE_ADMIN_CLIENT_EMAIL:latest,FIREBASE_ADMIN_PRIVATE_KEY=FIREBASE_ADMIN_PRIVATE_KEY:latest" \
  --allow-unauthenticated

# Note: If using default Compute Engine service account, omit the --service-account flag
```

**GitHub Actions (CI/CD):**

1. Create a Workload Identity Provider:
```bash
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

2. Grant the service account access:
```bash
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_ORG/YOUR_REPO"
```

3. Use in GitHub Actions workflow:
```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
    service_account: '${SERVICE_ACCOUNT}'

- name: Access secrets
  run: |
    gcloud secrets versions access latest --secret="SESSION_SECRET"
```

**Least-Privilege IAM Roles:**
- `roles/secretmanager.secretAccessor` - Read secret values only (recommended for app service accounts)
- `roles/secretmanager.admin` - Full admin (use sparingly, typically for CI/CD setup only)

**References:**
- [Secret Manager documentation](https://cloud.google.com/secret-manager/docs)
- [Workload Identity setup](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Cloud Run secrets integration](https://cloud.google.com/run/docs/configuring/secrets)

## Dev Workflow

### Start Services

```bash
# Terminal 1: Start API (port 3000)
cd api
pnpm dev

# Terminal 2: Start Frontend (port 3001)
cd frontend-next
pnpm dev
```

Or use workspace filters from root:
```bash
pnpm --filter api dev
pnpm --filter frontend-next dev
```

### Verify Setup

**API Health Check:**
```bash
curl -I http://localhost:3000/health
# Expected: 200 OK with Content-Type: application/json
```

**Frontend:**
```
Open http://localhost:3001 in browser
```

## Build

```bash
# Build all workspaces
pnpm -r build

# Or individual
pnpm --filter api build
pnpm --filter frontend-next build
```

## Tests & Evidence

```bash
# Type-check across workspaces
pnpm -r typecheck

# Lint
pnpm -r lint

# Frontend a11y (produces HTML under a11y-frontend-next/<commit-sha>/)
cd frontend-next
pnpm test:e2e

# API contract tests (200/401/403/404/422/429/413/503)
cd api
pnpm test -- tests/contracts/
```

## Try It

1. Visit http://localhost:3001
2. Sign up / Log in via Firebase Auth
3. Create, edit, delete your own posts (owner role)
4. If you have admin role, verify you can moderate any post

## Troubleshooting

### Port Already in Use
If `pnpm dev` fails with "EADDRINUSE":
- Check what's using the port: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
- Kill the process or change the `PORT` in `.env`

### CORS Errors
- Verify `ALLOW_ORIGIN` includes your frontend URL (`http://localhost:3001`)
- Ensure `ALLOW_CREDENTIALS` is `false` unless explicitly needed (and origins are exact)

### Firebase Auth Errors
- Check Firebase console for project status
- Verify all required Firebase env vars are set
- If using emulators, ensure emulator hosts are configured and emulators are running

### Session Cookie Issues (SameSite=Strict)
- For local dev across origins, you may need to use `SameSite=Lax`
- See `README.md` and plan.md for pivot conditions (T048, T082)

## Next Steps

- See [spec.md](./spec.md) for full feature requirements
- See [plan.md](./plan.md) for day-by-day PR strategy
- See [tasks.md](./tasks.md) for granular implementation checklist
=======
# Quickstart – Week 8 Identity Platform

## Prereqs
- Node 20.x, pnpm 9.x
- .env.local configured (see README truth table): API_BASE_URL, NEXT_PUBLIC_API_URL, Firebase config, SESSION_SECRET

## Install
```
corepack enable && corepack prepare pnpm@9.x --activate
pnpm install
```

## Dev
```
pnpm --filter frontend-next dev
pnpm --filter api dev
```

## Build
```
pnpm build
```

## Tests / Evidence
```
pnpm run test:types && pnpm run lint
# Frontend a11y smoke (produces HTML under a11y-frontend-next/<commit-sha>/)
# API contract tests: ensure 200/401/403/404/422/429 pass
```

## Try It
- Visit http://localhost:5000
- Login, create/edit/delete own posts (owner); verify admin can mutate any post
main
