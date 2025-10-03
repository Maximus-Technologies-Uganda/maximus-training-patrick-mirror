# Local Testing Guide for Cloud Run Deployment

Since Docker is not installed locally, here are your options for testing the deployment:

---

## Option 1: Test via GitHub Actions (Recommended) ✅

The easiest way to test is to push to GitHub and let the workflow build and deploy in the cloud.

### Steps:

1. **Commit your changes**:
```bash
cd C:\Users\LENOVO\Training

# Stage all deployment files
git add .github/workflows/deploy-cloud-run.yml
git add specs/005-week-6-finishers/
git add frontend-next/Dockerfile
git add frontend-next/Dockerfile.backup
git add frontend-next/next.config.ts

# Commit
git commit -m "feat: add Cloud Run deployment workflow

- Configure automated deployment to Google Cloud Run
- Set up Workload Identity Federation for secure authentication
- Add comprehensive deployment documentation
- Update Next.js config for standalone output mode
"
```

2. **Push to development branch** (safer for first test):
```bash
git push origin feat/DEV-417-update-readme-and-deploy-config
```

3. **Monitor the deployment**:
   - Go to: https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions
   - Watch the "Deploy to Cloud Run" workflow execute
   - Check for any errors in the build or deployment steps

4. **Get the deployed URL**:
   - The workflow will output the service URL in the summary
   - Or run: `gcloud run services describe maximus-training-frontend --region=us-central1 --project=proj-app-dev --format='value(status.url)'`

### Advantages:
- ✅ No local Docker installation needed
- ✅ Tests the actual deployment pipeline
- ✅ Verifies Workload Identity Federation works
- ✅ Confirms IAM permissions are correct
- ✅ Real Cloud Run environment

---

## Option 2: Test Locally with npm (Without Docker)

You can test the Next.js application locally without Docker:

### Steps:

```bash
cd C:\Users\LENOVO\Training\frontend-next

# Install dependencies (if not already done)
npm ci

# Build the application
npm run build

# Run in production mode locally
npm run start

# Open http://localhost:3000 in your browser
```

### What this tests:
- ✅ Next.js build succeeds
- ✅ Application starts correctly
- ✅ Basic functionality works
- ❌ Does NOT test Docker image
- ❌ Does NOT test Cloud Run environment
- ❌ Does NOT test deployment pipeline

---

## Option 3: Install Docker Desktop (Optional)

If you want to test Docker builds locally in the future:

### Install Docker Desktop for Windows:

1. Download from: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Restart your computer
4. Verify installation: `docker --version`

### Then test the build:

```bash
cd C:\Users\LENOVO\Training

# Build the Docker image
docker build -t maximus-training-frontend:local -f frontend-next/Dockerfile .

# Run the container locally
docker run -p 3000:3000 maximus-training-frontend:local

# Open http://localhost:3000
```

### Advantages:
- ✅ Test Docker builds locally before pushing
- ✅ Catch Dockerfile errors early
- ✅ Test in environment similar to Cloud Run
- ❌ Requires Docker Desktop installation (~500MB)
- ❌ Requires Windows Subsystem for Linux (WSL2)

---

## Option 4: Use Google Cloud Build (No local Docker)

Build the image directly in Google Cloud without Docker locally:

```bash
cd C:\Users\LENOVO\Training

# Submit build to Cloud Build
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/proj-app-dev/cloud-run-images/maximus-training-frontend:test \
  --project proj-app-dev \
  frontend-next

# Deploy the built image
gcloud run deploy maximus-training-frontend-test \
  --image us-central1-docker.pkg.dev/proj-app-dev/cloud-run-images/maximus-training-frontend:test \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project proj-app-dev
```

### Advantages:
- ✅ No local Docker needed
- ✅ Tests actual build in Cloud environment
- ✅ Can deploy test version before production
- ❌ Uses Cloud Build credits
- ❌ Slower than local builds

---

## Recommended Approach for You 🎯

Since Docker isn't installed locally, I recommend:

### Step 1: Test Next.js Build Locally (Quick validation)
```bash
cd C:\Users\LENOVO\Training\frontend-next
npm run build
```

If this succeeds, your application code is likely fine.

### Step 2: Push and Deploy via GitHub Actions (Full test)
```bash
git add .
git commit -m "feat: add Cloud Run deployment"
git push origin feat/DEV-417-update-readme-and-deploy-config
```

### Step 3: Monitor and Verify
- Watch GitHub Actions workflow
- Check deployed URL
- Test application functionality

---

## Pre-Flight Checklist ✈️

Before pushing, verify:

- [ ] `frontend-next/Dockerfile` exists
- [ ] `frontend-next/package.json` has all dependencies
- [ ] `frontend-next/next.config.ts` has `output: "standalone"`
- [ ] `.github/workflows/deploy-cloud-run.yml` is committed
- [ ] IAM setup is complete (✅ already done)
- [ ] No uncommitted changes in `frontend-next/`

### Check for issues:

```bash
cd C:\Users\LENOVO\Training\frontend-next

# Verify Next.js config
type next.config.ts | findstr "standalone"

# Check package.json exists
if exist package.json echo "✓ package.json found" else echo "✗ package.json missing"

# Check Dockerfile exists  
if exist Dockerfile echo "✓ Dockerfile found" else echo "✗ Dockerfile missing"

# Verify build script exists
npm run build --dry-run
```

---

## What Happens When You Push? 🚀

1. **GitHub Actions triggers** on push to `main` or `development`
2. **Checkout code** from your repository
3. **Authenticate** to Google Cloud using Workload Identity
4. **Build Docker image** using Cloud Build
5. **Push image** to Artifact Registry
6. **Deploy to Cloud Run** with zero-downtime
7. **Report URL** in workflow summary

### Expected Timeline:
- **Build**: 3-5 minutes
- **Push**: 1-2 minutes
- **Deploy**: 1-2 minutes
- **Total**: ~5-10 minutes

---

## If Build Fails 🔧

Common issues and fixes:

### 1. Dockerfile Errors
```bash
# Error: COPY failed
# Fix: Ensure paths in Dockerfile are correct relative to build context
```

### 2. Build Errors
```bash
# Error: Module not found
# Fix: Ensure all dependencies are in package.json
cd frontend-next
npm install --save <missing-package>
```

### 3. Next.js Build Errors
```bash
# Error: Build failed
# Fix: Test build locally first
cd frontend-next
npm run build
```

### 4. Authentication Errors
```bash
# Error: Permission denied
# Fix: Verify IAM setup in Google Cloud Console
```

---

## Next Steps 📋

1. **Run local Next.js build test** (to catch obvious errors)
   ```bash
   cd frontend-next
   npm run build
   ```

2. **Commit and push** to trigger deployment
   ```bash
   git add .
   git commit -m "feat: add Cloud Run deployment"
   git push origin feat/DEV-417-update-readme-and-deploy-config
   ```

3. **Monitor deployment** in GitHub Actions

4. **Access deployed app** via Cloud Run URL

5. **Update README.md** with live demo URL

---

## Support

- **GitHub Actions**: https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions
- **Cloud Run Console**: https://console.cloud.google.com/run?project=proj-app-dev
- **Build Logs**: Available in GitHub Actions workflow output
- **Runtime Logs**: `gcloud run services logs read maximus-training-frontend --region=us-central1 --project=proj-app-dev`

**Ready to deploy!** 🚀

