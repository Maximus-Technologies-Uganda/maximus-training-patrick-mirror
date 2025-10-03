# ⚠️ Admin Action Required via Console

## Current Situation

Your account (`patrick.zizinga@maximusglobal.net`) doesn't have permission to modify service account IAM policies via the CLI. This requires the **Service Account Admin** role.

However, you can still complete this using the **Google Cloud Console**, which often has more granular permission controls.

---

## ✅ Solution: Add Permission via Console

### Step-by-Step Instructions (1-2 minutes):

1. **Go to IAM & Admin → Service Accounts**:
   - Direct link: https://console.cloud.google.com/iam-admin/serviceaccounts?project=proj-app-dev

2. **Find and click** on the service account:
   - `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`

3. **Click on the "PERMISSIONS" tab** (at the top of the page)

4. **Click "+ GRANT ACCESS"** button

5. **Fill in the form**:
   - **New principals**: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`
     - (Yes, you're granting the service account permission to itself - this is called "self-impersonation")
   - **Select a role**: Type "Service Account Token Creator" and select it
     - Role ID: `roles/iam.serviceAccountTokenCreator`

6. **Click "SAVE"**

---

## 🎯 What This Does

This grants the `github-actions-deployer` service account permission to:
- Generate short-lived access tokens for itself
- Authenticate with Google Cloud services when using Workload Identity Federation
- Push Docker images to Artifact Registry
- Deploy to Cloud Run

This is the **final missing permission** for the deployment to work!

---

## 🔄 After Adding the Permission

Once you've added the permission in the Console:

### Option 1: Re-run the Failed Workflow (Easiest)
1. Go to: https://github.com/Maximus-Technologies-Uganda/Training/actions
2. Find the failed "Deploy to Cloud Run" workflow run
3. Click **"Re-run failed jobs"**

### Option 2: Trigger a New Run
Make a small change and push:
```bash
git commit --allow-empty -m "chore: trigger deployment after IAM fix"
git push origin feat/DEV-417-update-readme-and-deploy-config
```

---

## 📋 Complete Permission Summary

After this fix, `github-actions-deployer` will have all required permissions:

### ✅ Already Configured:
- **Workload Identity User** (on the service account itself) - ✅ Added
- **Cloud Run Admin/Developer** (project-level) - ✅ Exists
- **Service Account User** (project-level) - ✅ Exists
- **Artifact Registry Writer** (repository-level) - ✅ Exists

### ⏳ Needs to be Added NOW:
- **Service Account Token Creator** (on itself for self-impersonation) - **ADD THIS**

---

## 🚀 Expected Result

Once this permission is added and the workflow is re-run, you'll see:

```
✅ Checkout code
✅ Authenticate to Google Cloud       ← Will now succeed!
✅ Set up Cloud SDK
✅ Configure Docker for Artifact Registry
✅ Build and push Docker image        ← Will now succeed!
✅ Deploy to Cloud Run
✅ Verify deployment

🎉 Deployment Successful!
Service URL: https://maximus-training-frontend-xxxxx.a.run.app
```

---

## ❓ If Console Access Fails

If you also don't have permission via the Console, you'll need to contact your Google Cloud admin to:

1. Grant you the **Service Account Admin** role temporarily, OR
2. Have them add the permission directly using this command:

```bash
gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --member="serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project=proj-app-dev
```

---

## ⏱️ Timeline

- **Console fix**: 1-2 minutes
- **Re-run workflow**: 1 minute
- **Deployment completes**: 3-5 minutes
- **Total**: ~6 minutes to success! 🎉

