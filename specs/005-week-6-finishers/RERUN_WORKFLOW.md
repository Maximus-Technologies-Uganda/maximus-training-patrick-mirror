# How to Re-run the Failed Workflow

Now that you've updated the Workload Identity Provider attribute condition, you need to re-run the failed workflow.

## Option 1: Re-run via GitHub Actions UI (Easiest)

1. **Go to GitHub Actions**:
   - https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions

2. **Find the Failed Workflow**:
   - Click on "Deploy to Cloud Run" in the left sidebar
   - Click on the failed workflow run (should be at the top)

3. **Re-run the Workflow**:
   - Click the "Re-run all jobs" button in the top right
   - Wait for the workflow to complete

## Option 2: Push a Small Change

Alternatively, you can trigger a new workflow run by pushing a small change:

```bash
cd C:\Users\LENOVO\Training

# Make a small change (like updating a comment or documentation)
# Then commit and push

git add .
git commit -m "trigger deployment"
git push origin feat/DEV-417-update-readme-and-deploy-config
```

## What to Expect

Once the workflow runs successfully, you should see:

1. ✅ **Authenticate to Google Cloud** - Should now pass!
2. ✅ **Build and push Docker image** - ~2-3 minutes
3. ✅ **Deploy to Cloud Run** - ~1-2 minutes
4. ✅ **Service URL** - Displayed in the workflow output

## Verification

After successful deployment:

1. **Check Cloud Run Services**:
   ```bash
   gcloud run services list --project=proj-app-dev
   ```

2. **Get the Service URL**:
   ```bash
   gcloud run services describe maximus-training-frontend --region=us-central1 --project=proj-app-dev --format="value(status.url)"
   ```

3. **Visit the URL** to see your deployed application! 🎉

---

## Troubleshooting

If the workflow still fails:

### Issue: Still getting "unauthorized_client" error
- **Solution**: Double-check the attribute condition was saved correctly
- **Verify**: Run this command to see the current condition:
  ```bash
  gcloud iam workload-identity-pools providers describe github-provider --location="global" --workload-identity-pool="github-pool" --project=proj-app-dev --format="value(attributeCondition)"
  ```

### Issue: Docker build fails
- **Solution**: Check the Dockerfile and build context
- **Verify**: The Dockerfile exists in `frontend-next/Dockerfile`

### Issue: Deployment times out
- **Solution**: Check Cloud Run quotas and service limits
- **Verify**: Ensure the service has enough memory/CPU allocated

---

## Success Criteria

Your deployment is successful when you see:

```
✓ Authenticate to Google Cloud
✓ Build and push Docker image  
✓ Deploy to Cloud Run
✓ Service URL: https://maximus-training-frontend-XXXXXXXXXX.run.app
```

Visit the URL and confirm your Next.js application is running! 🚀

