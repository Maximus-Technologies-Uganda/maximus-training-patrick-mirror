# IAM Setup for Cloud Run Deployment - Admin Required

**Project**: `proj-app-dev` (673209018655)  
**Requested by**: patrick.zizinga@maximusglobal.net  
**Date**: 2025-10-01

---

## Overview

This document provides the IAM configuration steps required to enable automated deployment of the `frontend-next` application to Google Cloud Run via GitHub Actions using Workload Identity Federation.

## Prerequisites Completed

The following resources have already been created and are ready for IAM configuration:

- ✅ Service Account: `github-actions-deploy@proj-app-dev.iam.gserviceaccount.com`
- ✅ Artifact Registry Repository: `us-central1-docker.pkg.dev/proj-app-dev/cloud-run-images`
- ✅ Workload Identity Pool: `github-pool`
- ✅ Workload Identity Provider: `github-provider`
- ✅ Required APIs: Cloud Run, Artifact Registry, Cloud Build, IAM

## Required IAM Bindings

### Step 1: Grant Roles to Service Account

The service account `github-actions-deploy@proj-app-dev.iam.gserviceaccount.com` needs the following project-level roles:

#### Option A: Using gcloud CLI

Run these commands as a user with **Project IAM Admin** or **Owner** role:

```bash
# 1. Cloud Run Admin - to deploy and manage Cloud Run services
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# 2. Service Account User - to deploy as a service account
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 3. Artifact Registry Writer - to push Docker images
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# 4. Cloud Build Service Account - to build Docker images
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

#### Option B: Using Google Cloud Console

1. Navigate to [IAM & Admin > IAM](https://console.cloud.google.com/iam-admin/iam?project=proj-app-dev)
2. Click **+ GRANT ACCESS**
3. In "New principals", enter: `github-actions-deploy@proj-app-dev.iam.gserviceaccount.com`
4. Click "Select a role" and add each of these roles:
   - **Cloud Run Admin** (`roles/run.admin`)
   - **Service Account User** (`roles/iam.serviceAccountUser`)
   - **Artifact Registry Writer** (`roles/artifactregistry.writer`)
   - **Cloud Build Service Account** (`roles/cloudbuild.builds.builder`)
5. Click **SAVE**

### Step 2: Bind Service Account to Workload Identity Pool

This allows GitHub Actions from the specified repository to authenticate as the service account using Workload Identity Federation (no service account keys needed).

#### Option A: Using gcloud CLI

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deploy@proj-app-dev.iam.gserviceaccount.com \
  --project=proj-app-dev \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror"
```

#### Option B: Using Google Cloud Console

1. Navigate to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=proj-app-dev)
2. Click on `github-actions-deploy@proj-app-dev.iam.gserviceaccount.com`
3. Go to the **PERMISSIONS** tab
4. Click **GRANT ACCESS**
5. In "New principals", enter:
   ```
   principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror
   ```
6. Click "Select a role" and choose **Workload Identity User** (`roles/iam.workloadIdentityUser`)
7. Click **SAVE**

## Verification

After completing the IAM bindings, verify the configuration:

### Verify Service Account Roles

```bash
gcloud projects get-iam-policy proj-app-dev \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

**Expected output should include:**
```
ROLE
roles/artifactregistry.writer
roles/cloudbuild.builds.builder
roles/iam.serviceAccountUser
roles/run.admin
```

### Verify Workload Identity Binding

```bash
gcloud iam service-accounts get-iam-policy \
  github-actions-deploy@proj-app-dev.iam.gserviceaccount.com \
  --project=proj-app-dev \
  --format=json
```

**Expected output should include:**
```json
{
  "bindings": [
    {
      "role": "roles/iam.workloadIdentityUser",
      "members": [
        "principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror"
      ]
    }
  ]
}
```

## Security Considerations

### Principle of Least Privilege

The roles granted follow the principle of least privilege:
- **Cloud Run Admin**: Required to create, update, and manage Cloud Run services
- **Service Account User**: Required to deploy services that run as service accounts
- **Artifact Registry Writer**: Required to push Docker images to the registry
- **Cloud Build Service Account**: Required to build Docker images

### Workload Identity Federation Benefits

- ✅ **No Service Account Keys**: GitHub Actions authenticates using OIDC tokens
- ✅ **Automatic Key Rotation**: No manual key management required
- ✅ **Repository Scoped**: Only the specified GitHub repository can authenticate
- ✅ **Branch Protected**: Can be further restricted to specific branches if needed

### Repository Restriction

The Workload Identity binding is restricted to:
- **Repository**: `Maximus-Technologies-Uganda/maximus-training-patrick-mirror`
- **Branches**: Any branch (can be restricted in the provider's attribute condition)

To further restrict to specific branches, update the Workload Identity Provider's attribute condition in the [Workload Identity Federation Console](https://console.cloud.google.com/iam-admin/workload-identity-pools?project=proj-app-dev).

## Deployment Workflow

Once IAM is configured, the deployment workflow will:

1. **Trigger**: Automatically on push to `main` or `development` branches
2. **Authenticate**: Using Workload Identity Federation (no keys stored in GitHub)
3. **Build**: Create Docker image from `frontend-next/Dockerfile`
4. **Push**: Upload image to Artifact Registry
5. **Deploy**: Deploy to Cloud Run service `maximus-training-frontend`
6. **Expose**: Make service publicly accessible at a Cloud Run URL

## Troubleshooting

### If deployment fails with "Permission Denied"

1. Verify all four roles are granted to the service account
2. Check that the Workload Identity binding is correct
3. Ensure the GitHub repository name matches exactly
4. Review Cloud Run deployment logs

### If Docker push fails

- Verify the service account has `roles/artifactregistry.writer`
- Check that the Artifact Registry repository exists: `cloud-run-images` in `us-central1`

### If Cloud Run deployment fails

- Verify the service account has `roles/run.admin`
- Check Cloud Run API is enabled
- Review service account permissions on the Cloud Run service itself

## Support

For questions or issues, contact:
- **Requester**: patrick.zizinga@maximusglobal.net
- **Project**: proj-app-dev
- **Documentation**: `specs/005-week-6-finishers/DEPLOYMENT_SETUP.md`

## Approval

By completing this setup, you authorize:
- Automated deployments from the specified GitHub repository
- Service account to manage Cloud Run services in `proj-app-dev`
- Docker image storage in Artifact Registry

**Admin completing setup:**
- Name: _________________________
- Email: _________________________
- Date: _________________________
- Signature: _________________________

---

## Quick Copy-Paste Commands

For admins who prefer command-line setup, here are all commands in sequence:

```bash
# Set project
gcloud config set project proj-app-dev

# Grant all four roles
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

# Bind to Workload Identity
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deploy@proj-app-dev.iam.gserviceaccount.com \
  --project=proj-app-dev \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror"

# Verify
gcloud projects get-iam-policy proj-app-dev \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-deploy@proj-app-dev.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

echo "✓ IAM setup complete!"
```

