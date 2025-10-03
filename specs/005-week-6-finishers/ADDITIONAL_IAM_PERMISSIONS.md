# Additional IAM Permissions Required

## Issue
The deployment build succeeded but failed to push the Docker image to Artifact Registry due to missing permissions.

## Error Messages
```
Permission 'iam.serviceAccounts.getAccessToken' denied
Permission 'artifactregistry.repositories.uploadArtifacts' denied
```

---

## Required IAM Roles

Your admin needs to grant **two additional roles** to the service account:

### Service Account Details
- **Service Account Email**: `github-actions@proj-app-dev.iam.gserviceaccount.com`
- **Project**: `proj-app-dev`

---

## Option 1: Using Google Cloud Console (Recommended)

### Step 1: Grant Service Account Token Creator Role

1. Go to [IAM & Admin → IAM](https://console.cloud.google.com/iam-admin/iam?project=proj-app-dev)
2. Find the service account: `github-actions@proj-app-dev.iam.gserviceaccount.com`
3. Click the **pencil icon** (Edit principal)
4. Click **"+ ADD ANOTHER ROLE"**
5. Search for and select: **Service Account Token Creator**
   - Role: `roles/iam.serviceAccountTokenCreator`
6. Click **"SAVE"**

### Step 2: Grant Artifact Registry Writer Role

1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts?project=proj-app-dev)
2. Click on the repository: `cloud-run-images` (in `us-central1`)
3. Click **"PERMISSIONS"** tab at the top
4. Click **"+ GRANT ACCESS"**
5. In "New principals", enter: `github-actions@proj-app-dev.iam.gserviceaccount.com`
6. In "Select a role", search for and select: **Artifact Registry Writer**
   - Role: `roles/artifactregistry.writer`
7. Click **"SAVE"**

---

## Option 2: Using gcloud CLI

Run these commands (requires Project Owner or IAM Admin permissions):

```bash
# Grant Service Account Token Creator role
gcloud projects add-iam-policy-binding proj-app-dev \
    --member="serviceAccount:github-actions@proj-app-dev.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator"

# Grant Artifact Registry Writer role
gcloud artifacts repositories add-iam-policy-binding cloud-run-images \
    --location=us-central1 \
    --member="serviceAccount:github-actions@proj-app-dev.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"
```

---

## Complete List of Required Roles

After these changes, the service account should have:

| Role | Purpose | Status |
|------|---------|--------|
| **Workload Identity User** | Allow GitHub Actions to authenticate | ✅ Already granted |
| **Service Account Token Creator** | Generate access tokens for the service account | ⏳ Need to add |
| **Artifact Registry Writer** | Push Docker images to Artifact Registry | ⏳ Need to add |
| **Cloud Run Developer** | Deploy services to Cloud Run | ✅ Already granted |
| **Service Account User** | Act as the service account | ✅ Already granted |

---

## Verification

After granting the permissions, verify they were applied:

```bash
# Check IAM policy for the service account
gcloud projects get-iam-policy proj-app-dev \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:github-actions@proj-app-dev.iam.gserviceaccount.com" \
    --format="table(bindings.role)"

# Check Artifact Registry permissions
gcloud artifacts repositories get-iam-policy cloud-run-images \
    --location=us-central1 \
    --filter="bindings.members:serviceAccount:github-actions@proj-app-dev.iam.gserviceaccount.com" \
    --format="table(bindings.role)"
```

Expected output should include:
- `roles/iam.serviceAccountTokenCreator`
- `roles/artifactregistry.writer`

---

## Re-run the Deployment

Once the permissions are granted:

1. Go to [GitHub Actions](https://github.com/Maximus-Technologies-Uganda/maximus-training-patrick-mirror/actions)
2. Find the failed workflow run
3. Click **"Re-run failed jobs"**

The deployment should now succeed! 🚀

---

## Why These Permissions Are Needed

1. **Service Account Token Creator**: Allows Workload Identity Federation to generate short-lived access tokens for the GitHub Actions workflow
2. **Artifact Registry Writer**: Allows the workflow to push Docker images to your Artifact Registry repository

Both are essential for the CI/CD pipeline to work properly.

