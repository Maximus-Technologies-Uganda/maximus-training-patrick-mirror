# Fix: Service Account Token Creator Permission

## 🔴 Current Error

```
Permission 'iam.serviceAccounts.getAccessToken' denied on resource (or it may not exist).
```

This error occurs because the `github-actions-deployer` service account needs permission to **generate access tokens for itself** when authenticating with Workload Identity Federation.

---

## ✅ Solution: Grant Service Account Token Creator Role

The service account needs to be able to impersonate itself to generate short-lived access tokens.

### Option 1: Using Google Cloud Console (Quickest - 1 minute)

1. **Go to IAM & Admin → Service Accounts**:
   - URL: https://console.cloud.google.com/iam-admin/serviceaccounts?project=proj-app-dev

2. **Find and click** on: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`

3. **Go to the "PERMISSIONS" tab**

4. **Click "+ GRANT ACCESS"**

5. **Configure the IAM binding**:
   - **New principals**: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`
   - **Role**: Select **Service Account Token Creator**
     - Role ID: `roles/iam.serviceAccountTokenCreator`

6. **Click "SAVE"**

---

### Option 2: Using gcloud CLI

Run this command:

```bash
gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --member="serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project=proj-app-dev
```

---

## 🔍 What This Does

This grants the service account permission to:
- Generate short-lived access tokens for itself
- Authenticate with Google Cloud services (Artifact Registry, Cloud Run)
- Use Workload Identity Federation properly

This is a **self-impersonation** permission - the service account needs to be able to act as itself when GitHub Actions authenticates.

---

## ✅ Verification

After adding the permission, verify it was applied:

```bash
gcloud iam service-accounts get-iam-policy github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --project=proj-app-dev \
    --format=json
```

Look for a binding with:
- **role**: `roles/iam.serviceAccountTokenCreator`
- **members**: Contains `serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`

---

## 🔄 Re-run the Deployment

Once the permission is added:

### Option 1: Re-run via GitHub UI
1. Go to: https://github.com/Maximus-Technologies-Uganda/Training/actions
2. Click on the failed workflow run
3. Click **"Re-run failed jobs"**

### Option 2: Push a dummy commit
```bash
git commit --allow-empty -m "chore: trigger deployment retry"
git push origin feat/DEV-417-update-readme-and-deploy-config
```

---

## 📋 Complete Permission Checklist

After this fix, `github-actions-deployer` should have:

### Project-Level IAM Roles:
- ✅ **Cloud Run Admin** (or Developer)
- ✅ **Service Account User**
- ⏳ **Service Account Token Creator** ← **ADD THIS NOW**

### Service Account-Level Permissions:
- ✅ **Workload Identity User** (already added)
- ⏳ **Service Account Token Creator** (self-impersonation) ← **ADD THIS NOW**

### Artifact Registry Repository-Level:
- ✅ **Artifact Registry Writer**

---

## 🎯 Why This Happened

The `github-actions-deployer` service account has all the project-level and repository-level permissions, but it's missing the **self-impersonation permission** that allows Workload Identity Federation to generate access tokens on its behalf.

This is a common gotcha with Workload Identity - the service account needs to be able to impersonate itself!

---

## ⏱️ ETA After Fix

Once you add this permission:
- **Immediate**: Permission takes effect
- **1 minute**: Re-run the workflow
- **3-5 minutes**: Deployment completes successfully
- **Total**: ~5 minutes to deployment! 🚀

