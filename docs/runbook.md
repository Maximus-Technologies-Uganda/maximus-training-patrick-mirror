# Application Health Runbook

This runbook provides simple steps for auditors or operators to verify the basic health of the deployed application.

## 1. Verify Frontend Availability

* **Action:** Open the live frontend URL in a web browser.
* **URL:** `https://maximus-training-frontend-673209018655.africa-south1.run.app`
* **Expected Result:** The application should load successfully (HTTP 200 OK) without any server errors. The `/posts` page should display post data on the initial load.

## 2. Verify API Health

* **Action:** Open the API health check endpoint in a web browser or using a tool like `curl`.
* **URL:** `https://maximus-training-api-wyb2jsgqyq-bq.a.run.app/health`
* **Expected Result:** The endpoint should return a JSON object `{"status":"ok"}`. This confirms the API service is running and reachable.

## 3. Verify SSR First Paint

* **Action:** Load the `/posts` page and inspect the initial HTML source.
* **How to inspect:**
  1. Navigate to `https://maximus-training-frontend-673209018655.africa-south1.run.app/posts`
  2. Right-click and select "View Page Source" (or use Ctrl+U)
  3. Search for post content in the HTML (before any client-side JavaScript executes)
* **Expected Result:** Post data should be visible in the initial HTML response, confirming server-side rendering is working correctly.

## 4. Check CI/CD Pipeline Status

* **Action:** View the latest GitHub Actions workflow run.
* **URL:** `https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/quality-gate.yml`
* **Expected Result:** The most recent workflow run on the default branch should show all checks passing (green checkmarks).

## 5. Review Quality Gate Artifacts

* **Action:** Download and inspect the latest quality gate artifacts from a successful CI run.
* **Artifacts to check:**
  * `coverage-frontend-next` - Test coverage HTML report
  * `a11y-frontend-next` - Accessibility scan results
  * `contract-api` - API contract validation report
* **Expected Result:** All artifacts should be present and show no critical violations or failures.

## Troubleshooting

### Frontend Not Loading
- Check Cloud Run service status in Google Cloud Console
- Verify environment variables are set (`API_BASE_URL`, `NEXT_PUBLIC_API_URL`)
- Check recent deployment logs for errors

### API Health Check Failing
- Verify API Cloud Run service is running
- Check for recent deployments that may have introduced errors
- Review API service logs for startup errors

### SSR Not Working
- Verify `API_BASE_URL` environment variable is set on the frontend service
- Check frontend service logs for SSR-related errors
- Ensure API is accessible from the frontend service (network/firewall rules)

## Contact

For issues or questions, refer to:
- [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
- [DEVELOPMENT_RULES.md](../DEVELOPMENT_RULES.md) for quality standards
- GitHub Issues: https://github.com/Maximus-Technologies-Uganda/Training/issues
