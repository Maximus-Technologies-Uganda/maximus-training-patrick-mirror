# Deployment Trigger Guide for Mirror Repository

## Understanding the Mirror Setup

Since this is a **mirror repository**, deployments work differently than a standard repository:

- **Mirror repositories** sync from a primary repository
- **Workflows trigger** after merges are synced to the mirror
- **Direct pushes** to feature branches don't trigger production workflows

---

## How to Trigger a Deployment

### Current Workflow Configuration

The deployment workflow (`.github/workflows/deploy-cloud-run.yml`) is configured to trigger on:

```yaml
on:
  push:
    branches: [ main, development ]  # Only these branches trigger auto-deploy
    paths:
      - 'frontend-next/**'
      - '.github/workflows/deploy-cloud-run.yml'
  workflow_dispatch:  # Allows manual triggering
```

---

## Deployment Options

### Option 1: Merge to Development (Recommended) ✅

**Best for**: Production-ready changes that need to be deployed

1. **Create a Pull Request**
   ```bash
   # Already pushed, now create PR on GitHub
   # Go to: https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/pull/new/feat/DEV-417-update-readme-and-deploy-config
   ```

2. **Review and Approve** the PR following your team's review process

3. **Merge to `development` branch**
   - The mirror will sync
   - Workflow triggers automatically
   - Application deploys to Cloud Run

4. **Monitor Deployment**
   - Go to GitHub Actions: https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions
   - Watch the "Deploy to Cloud Run" workflow
   - Get the deployment URL from the workflow output

---

### Option 2: Manual Workflow Dispatch 🎯

**Best for**: Testing deployment without merging, or redeploying existing code

1. **Navigate to Actions Tab**
   - Go to: https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions

2. **Select the Workflow**
   - Click on "Deploy to Cloud Run" in the left sidebar

3. **Run Workflow**
   - Click "Run workflow" button (top right)
   - Select branch: `development` or your feature branch
   - Click "Run workflow" to start

4. **Monitor Progress**
   - Watch the live deployment logs
   - Get the Cloud Run URL from the output

---

### Option 3: Merge to Main (Production) 🚀

**Best for**: Deploying to production after testing in development

1. **First deploy to development** (Option 1)
2. **Test the deployment** thoroughly
3. **Create PR from development → main**
4. **Review and merge**
5. **Mirror syncs and deploys to production**

---

## Current Branch Status

You are currently on:
- **Branch**: `feat/DEV-417-update-readme-and-deploy-config`
- **Commit**: `508dc075` (pushed successfully)
- **Status**: Ready for PR to `development`

---

## Recommended Next Steps

### Immediate Action: Create Pull Request

1. **Create PR to development**
   ```
   Base: development
   Compare: feat/DEV-417-update-readme-and-deploy-config
   Title: Add Cloud Run deployment with Workload Identity Federation
   ```

2. **PR Description Template**:
   ```markdown
   ## Summary
   Implements automated deployment to Google Cloud Run using Workload Identity Federation for secure, keyless authentication.

   ## Changes
   - ✅ GitHub Actions workflow for CI/CD
   - ✅ Workload Identity Federation configuration
   - ✅ Dockerfile for containerized deployment
   - ✅ Comprehensive deployment documentation
   - ✅ Next.js standalone output configuration
   - ✅ Successfully tested local build

   ## Infrastructure
   - Service account: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`
   - Artifact Registry: `us-central1-docker.pkg.dev/proj-app-dev/cloud-run-images`
   - Workload Identity Pool: `github-pool`
   - Target Service: `maximus-training-frontend` on Cloud Run

   ## Testing
   - ✅ Local Next.js build successful
   - ✅ IAM permissions configured
   - ✅ All Google Cloud services enabled
   - ⏳ Awaiting first deployment test

   ## Documentation
   All setup guides and checklists are in `specs/005-week-6-finishers/`
   ```

3. **Review Process**
   - Request review from team lead
   - Address any feedback
   - Merge when approved

4. **Post-Merge**
   - Monitor GitHub Actions for deployment
   - Verify application is accessible
   - Test functionality on deployed URL
   - Update documentation with live URL

---

## Troubleshooting

### Workflow Doesn't Trigger After Merge

**Check**:
- Mirror sync completed successfully
- Changes include `frontend-next/**` or workflow file
- Branch is `development` or `main`

**Solution**: Use manual workflow dispatch (Option 2)

---

### Deployment Fails in GitHub Actions

**Common Issues**:
1. **IAM Permissions** - Verify all roles are correctly assigned (see `ADMIN_IAM_SETUP.md`)
2. **Workload Identity** - Check attribute condition matches repository
3. **Docker Build** - Review Dockerfile and build context
4. **API Quotas** - Ensure Cloud Run quotas are sufficient

**Debugging Steps**:
1. Check workflow logs in GitHub Actions
2. Verify Google Cloud resources:
   ```bash
   gcloud run services list --project=proj-app-dev
   gcloud artifacts repositories list --project=proj-app-dev
   ```
3. Test IAM bindings:
   ```bash
   gcloud projects get-iam-policy proj-app-dev \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:github-actions-deploy*"
   ```

---

## Important Notes

### Repository Attributes in Workload Identity

The Workload Identity Provider is configured to accept tokens from:
- Repository: `Maximus-Technologies-Uganda/maximus-training-patrick-mirror`
- Branch: `development` (refs/heads/development)
- Events: `push`, `pull_request`

If deploying from a different repository or branch, update the attribute condition in the Workload Identity Provider.

### Deployment Timing

- **Development deployments**: Trigger on merge to `development`
- **Production deployments**: Trigger on merge to `main`
- **Manual deployments**: Available via workflow_dispatch anytime

---

## Success Criteria

Your deployment is successful when:
- ✅ GitHub Actions workflow completes without errors
- ✅ Docker image pushed to Artifact Registry
- ✅ Cloud Run service updated with new revision
- ✅ Application accessible at Cloud Run URL
- ✅ Application functions correctly (UI loads, API calls work)

---

## Resources

- **Workflow File**: `.github/workflows/deploy-cloud-run.yml`
- **Setup Docs**: `specs/005-week-6-finishers/DEPLOYMENT_SETUP.md`
- **IAM Guide**: `specs/005-week-6-finishers/ADMIN_IAM_SETUP.md`
- **Checklist**: `specs/005-week-6-finishers/DEPLOYMENT_CHECKLIST.md`
- **Workload Identity**: `specs/005-week-6-finishers/WORKLOAD_IDENTITY_SETUP.md`

---

**Ready to Deploy?** Create your PR and let's get this to production! 🚀

