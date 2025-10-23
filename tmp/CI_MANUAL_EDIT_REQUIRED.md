# MANUAL EDIT REQUIRED: .github/workflows/ci.yml

## Location
File: `.github/workflows/ci.yml`
Insert after line 12 (after the `concurrency` block, before `jobs:`)

## Code to Add

Insert these two new CI jobs **after line 12** and **before the existing `contracts-spectral` job**:

```yaml
jobs:
  secret-scan:
    name: Security - Secret Scanning
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  app-router-check:
    name: Frontend - App Router Enforcement
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check for pages/ directory
        run: |
          if [ -d "frontend-next/pages" ] || [ -d "frontend-next/pages/api" ]; then
            echo "❌ ERROR: pages/ or pages/api/ directory found!"
            echo "App Router only: remove pages/ and pages/api/ directories."
            exit 1
          fi
          echo "✅ App Router enforcement passed"

  # Keep existing contracts-spectral job below...
```

## Why This is Needed

- **T055**: Adds secret scanning via Gitleaks to prevent committing secrets
- **T056**: Enforces App Router usage by checking for forbidden `pages/` directories

## How to Apply

1. Open `.github/workflows/ci.yml`
2. Find line 12 (the `cancel-in-progress: true` line)
3. After that line, change `jobs:` to the code block above
4. Save the file
5. Commit the change

This completes T055 and T056 CI integration.
