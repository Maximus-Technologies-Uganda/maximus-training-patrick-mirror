# Cloud Run Deployment Checklist

Use this checklist to track the deployment setup progress.

## Pre-Deployment Setup

### ✅ Infrastructure Setup (Completed by patrick.zizinga@maximusglobal.net)

- [x] Enable required Google Cloud APIs
  - [x] Cloud Run API
  - [x] Artifact Registry API
  - [x] Cloud Build API
  - [x] IAM APIs
- [x] Create Artifact Registry repository (`cloud-run-images` in `us-central1`)
- [x] Create service account (`github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`)
- [x] Create Workload Identity Pool (`github-pool`)
- [x] Create Workload Identity Provider (`github-provider`)
- [x] Create GitHub Actions deployment workflow (`.github/workflows/deploy-cloud-run.yml`)

### ⏳ IAM Configuration (Requires Admin/Owner)

- [ ] Grant IAM roles to service account (see `ADMIN_IAM_SETUP.md`)
  - [ ] Cloud Run Admin (`roles/run.admin`)
  - [ ] Service Account User (`roles/iam.serviceAccountUser`)
  - [ ] Artifact Registry Writer (`roles/artifactregistry.writer`)
  - [ ] Cloud Build Service Account (`roles/cloudbuild.builds.builder`)
- [ ] Bind service account to Workload Identity Pool
  - [ ] Workload Identity User role for GitHub repository principal
- [ ] Verify IAM bindings using verification commands

**Admin completing this section:**
- Name: _________________________
- Date: _________________________

## Deployment Workflow

### Testing Deployment

- [ ] Commit and push changes to `development` branch
- [ ] Verify GitHub Actions workflow triggers
- [ ] Monitor workflow execution in GitHub Actions UI
- [ ] Check for authentication success (Workload Identity)
- [ ] Verify Docker image build completes
- [ ] Verify image push to Artifact Registry succeeds
- [ ] Verify Cloud Run deployment succeeds
- [ ] Record deployed service URL: _________________________

### Production Deployment

- [ ] Merge changes to `main` branch
- [ ] Verify production deployment completes
- [ ] Test deployed application functionality
- [ ] Verify service is publicly accessible
- [ ] Record production service URL: _________________________

## Post-Deployment Verification

### Application Health

- [ ] Application loads successfully
- [ ] All pages render correctly
- [ ] API integration works (posts list, create, etc.)
- [ ] No console errors in browser
- [ ] Responsive design works on mobile

### Monitoring & Logging

- [ ] Cloud Run logs are accessible
  ```bash
  gcloud run services logs read maximus-training-frontend \
    --region=us-central1 --project=proj-app-dev
  ```
- [ ] Set up alerts for deployment failures (optional)
- [ ] Configure uptime monitoring (optional)

### Security Review

- [ ] Service is public (unauthenticated access allowed) ✓ (as designed)
- [ ] Environment variables don't expose secrets
- [ ] Docker image doesn't contain sensitive data
- [ ] Workload Identity Federation is being used (no service account keys)

## Documentation Updates

- [ ] Update `README.md` with deployment URL
- [ ] Add "Run & Try" section with live demo link
- [ ] Document environment variables required for local development
- [ ] Update `CHANGELOG.md` with deployment information

## Rollback Plan

If deployment fails or issues arise:

### Quick Rollback

```bash
# Rollback to previous revision
gcloud run services update-traffic maximus-training-frontend \
  --region=us-central1 \
  --project=proj-app-dev \
  --to-revisions=PREVIOUS_REVISION=100

# Or delete the service entirely
gcloud run services delete maximus-training-frontend \
  --region=us-central1 \
  --project=proj-app-dev
```

### Debug Commands

```bash
# View service details
gcloud run services describe maximus-training-frontend \
  --region=us-central1 --project=proj-app-dev

# View recent logs
gcloud run services logs read maximus-training-frontend \
  --region=us-central1 --project=proj-app-dev --limit=50

# List all revisions
gcloud run revisions list \
  --service=maximus-training-frontend \
  --region=us-central1 --project=proj-app-dev

# Check service account permissions
gcloud projects get-iam-policy proj-app-dev \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com"
```

## Useful Links

- [Cloud Run Console](https://console.cloud.google.com/run?project=proj-app-dev)
- [Artifact Registry Console](https://console.cloud.google.com/artifacts?project=proj-app-dev)
- [IAM Console](https://console.cloud.google.com/iam-admin?project=proj-app-dev)
- [Workload Identity Federation Console](https://console.cloud.google.com/iam-admin/workload-identity-pools?project=proj-app-dev)
- [GitHub Actions Workflows](https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions)

## Contact Information

**Primary Contact**: patrick.zizinga@maximusglobal.net  
**Project**: proj-app-dev (673209018655)  
**Region**: us-central1  
**Service Name**: maximus-training-frontend

## Sign-Off

### Infrastructure Setup
- **Completed by**: patrick.zizinga@maximusglobal.net
- **Date**: 2025-10-01

### IAM Configuration
- **Completed by**: _________________________
- **Date**: _________________________

### First Successful Deployment
- **Completed by**: _________________________
- **Date**: _________________________
- **Service URL**: _________________________

### Production Deployment
- **Completed by**: _________________________
- **Date**: _________________________
- **Service URL**: _________________________

