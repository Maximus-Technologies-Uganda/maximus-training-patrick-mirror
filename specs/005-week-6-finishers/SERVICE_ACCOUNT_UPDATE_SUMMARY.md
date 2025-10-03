# Service Account Update Summary

## ✅ Changes Completed

### 1. Workflow Updated
- **File**: `.github/workflows/deploy-cloud-run.yml`
- **Change**: Updated service account from `github-actions-deploy` to `github-actions-deployer`
- **Line 42**: `service_account: github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`
- **Commit**: `ad75d367`
- **Status**: ✅ Pushed to GitHub

---

## 🔧 Required: Workload Identity Binding

### What Needs to Be Done

The `github-actions-deployer` service account needs to be bound to the Workload Identity Pool to allow GitHub Actions to authenticate.

### Option 1: Using Google Cloud Console (Recommended - 2 minutes)

1. **Go to Service Accounts**:
   - Navigate to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=proj-app-dev

2. **Find and click** on: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`

3. **Go to the "PERMISSIONS" tab**

4. **Click "+ GRANT ACCESS"**

5. **Configure the IAM binding**:
   - **New principals**: Leave blank (we're using Workload Identity)
   - **Role**: Select **Workload Identity User**
     - Role ID: `roles/iam.workloadIdentityUser`

6. **Add a condition** (Click "ADD CONDITION"):
   - **Title**: `GitHub Actions for Training repositories`
   - **Condition Editor**: Switch to "CEL Editor" and paste:
   
   ```cel
   assertion.repository_owner == "Maximus-Technologies-Uganda" && 
   (assertion.repository == "Maximus-Technologies-Uganda/Training" || 
    assertion.repository == "Maximus-Technologies-Uganda/maximus-training-patrick-mirror")
   ```

7. **Click "SAVE"**

---

### Option 2: Using gcloud CLI

Run these two commands to bind both repositories:

```bash
# Bind the Training repository
gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/Training" \
    --project=proj-app-dev

# Bind the mirror repository
gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror" \
    --project=proj-app-dev
```

---

## ✅ Verification

After adding the binding, verify it was applied:

```bash
gcloud iam service-accounts get-iam-policy github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --project=proj-app-dev \
    --format=json
```

You should see a binding with:
- **role**: `roles/iam.workloadIdentityUser`
- **members**: References to the Workload Identity Pool principals

---

## 🚀 Expected Outcome

Once the Workload Identity binding is added, the GitHub Actions workflow will:

1. ✅ **Authenticate** using the `github-actions-deployer` service account
2. ✅ **Build** the Docker image successfully
3. ✅ **Push** to Artifact Registry (permissions already exist)
4. ✅ **Deploy** to Cloud Run (permissions already exist)
5. ✅ **Output** the service URL

---

## 📋 Why This Service Account?

The `github-actions-deployer` service account already has:
- ✅ **Service Account Token Creator** - Generate access tokens
- ✅ **Artifact Registry Writer** - Push Docker images
- ✅ **Cloud Run Developer/Admin** - Deploy to Cloud Run
- ⏳ **Workload Identity User** - **NEEDS TO BE ADDED** (this step)

---

## 📖 Additional Resources

- **Detailed Guide**: `UPDATE_WORKLOAD_IDENTITY_BINDING.md`
- **IAM Permissions**: `ADDITIONAL_IAM_PERMISSIONS.md` (no longer needed since this service account has all required permissions)

---

## Next Steps

1. **Add the Workload Identity binding** using one of the options above
2. **Wait for the workflow** to run automatically (triggered on push)
3. **Monitor the deployment** at: https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions
4. **Celebrate** when you see the service URL! 🎉

