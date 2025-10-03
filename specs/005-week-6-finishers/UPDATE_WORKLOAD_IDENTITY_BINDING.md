# Update Workload Identity Binding

## Overview
We need to update the Workload Identity Pool to use the `github-actions-deployer` service account instead of `github-actions-deploy`.

---

## Service Account Change
- **Old**: `github-actions-deploy@proj-app-dev.iam.gserviceaccount.com` (doesn't exist or lacks permissions)
- **New**: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com` (has all required permissions)

---

## Update Required

### Option 1: Using Google Cloud Console (Recommended)

1. **Navigate to IAM & Admin → Service Accounts**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=proj-app-dev

2. **Find the service account**: `github-actions-deployer@proj-app-dev.iam.gserviceaccount.com`

3. **Click on the service account** to view details

4. **Go to the "PERMISSIONS" tab**

5. **Click "+ GRANT ACCESS"**

6. **Configure the binding:**
   - **New principals**: Leave empty (we'll use attribute mapping)
   - **Select a role**: Choose **Workload Identity User**
     - Role: `roles/iam.workloadIdentityUser`
   
7. **Add condition** (Click "ADD CONDITION"):
   ```
   Title: GitHub Actions for Training repos
   
   Condition (CEL):
   assertion.repository_owner == "Maximus-Technologies-Uganda" && 
   (assertion.repository == "Maximus-Technologies-Uganda/Training" || 
    assertion.repository == "Maximus-Technologies-Uganda/maximus-training-patrick-mirror")
   ```

8. **Click "SAVE"**

---

### Option 2: Using gcloud CLI

Run this command to add the Workload Identity User binding:

```bash
gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/Training" \
    --project=proj-app-dev

gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --role="roles/iam.serviceAccountTokenCreator" \
    --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/Training" \
    --project=proj-app-dev

gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror" \
    --project=proj-app-dev

gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --role="roles/iam.serviceAccountTokenCreator" \
    --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror" \
    --project=proj-app-dev
```

---

## Verification

After updating the binding, verify it was applied:

```bash
gcloud iam service-accounts get-iam-policy github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
    --project=proj-app-dev \
    --format=json
```

You should see a binding with:
- **role**: `roles/iam.workloadIdentityUser`
- **role**: `roles/iam.serviceAccountTokenCreator`
- **members**: Contains references to the Workload Identity Pool

---

## Test the Deployment

Once the binding is updated:

1. **The workflow file has been updated** to use `github-actions-deployer`
2. **Commit and push the workflow change**:
   ```bash
   git add .github/workflows/deploy-cloud-run.yml
   git commit -m "chore: update workflow to use github-actions-deployer service account"
   git push
   ```

3. **The workflow will automatically trigger** and should now successfully:
   - ✅ Authenticate with Workload Identity
   - ✅ Build the Docker image
   - ✅ Push to Artifact Registry
   - ✅ Deploy to Cloud Run
   - ✅ Output the service URL

---

## Expected Roles for github-actions-deployer

This service account should already have these roles:
- ✅ **Workload Identity User** (needs to be added as shown above)
- ✅ **Service Account Token Creator**
- ✅ **Artifact Registry Writer**
- ✅ **Cloud Run Developer** (or Cloud Run Admin)
- ✅ **Service Account User**

If any are missing, refer to `ADDITIONAL_IAM_PERMISSIONS.md` for instructions.

