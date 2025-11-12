/**
 * @file verify-invoker.ts
 * @description CI gate: Verify frontend SA has roles/run.invoker on Cloud Run API
 * 
 * **FR-016** (IAM): Service account must have permission to invoke API
 * 
 * Purpose:
 * - Ensures frontend SA can call API via identity federation
 * - Checks IAM binding: frontend SA → roles/run.invoker on API service
 * - Fail if missing, warn if warning conditions
 * 
 * Exit codes:
 * - 0: Binding verified ✅
 * - 1: Binding missing or invalid (FAIL - blocks deploy)
 * - 2: Check skipped (no GCP context)
 * 
 * Execution:
 * - CI: npm run verify:invoker
 * - Local: Requires gcloud auth with appropriate permissions
 * 
 * Requirements:
 * - GCP_PROJECT_ID set
 * - FRONTEND_SA_EMAIL set
 * - API_CLOUD_RUN_SERVICE set (service name)
 * - gcloud CLI available
 * 
 * Limitation:
 * - Requires Owner or IAM Admin role on project
 * - In CI, use Workload Identity or service account with appropriate role
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VerifyInvokerOptions {
  projectId?: string;
  frontendSaEmail?: string;
  apiService?: string;
  dryRun?: boolean;
}

/**
 * Verify frontend SA has roles/run.invoker on API
 */
async function verifyInvoker(options: VerifyInvokerOptions = {}) {
  const projectId = options.projectId || process.env.GCP_PROJECT_ID;
  const frontendSaEmail =
    options.frontendSaEmail || process.env.FRONTEND_SA_EMAIL;
  const apiService = options.apiService || process.env.API_CLOUD_RUN_SERVICE;

  console.log('🔐 Verifying frontend SA invoker role...');
  console.log(`   Project: ${projectId}`);
  console.log(`   Frontend SA: ${frontendSaEmail}`);
  console.log(`   API Service: ${apiService}`);

  // Validate inputs
  if (!projectId || !frontendSaEmail || !apiService) {
    console.warn('⚠️  Skipping invoker role check (missing env vars)');
    console.log('   Set: GCP_PROJECT_ID, FRONTEND_SA_EMAIL, API_CLOUD_RUN_SERVICE');
    return { verified: false, skipped: true };
  }

  try {
    // Get Cloud Run service resource name
    console.log('\n📋 Fetching Cloud Run service...');
    const { stdout: serviceJson } = await execAsync(
      `gcloud run services describe ${apiService} ` +
        `--project=${projectId} ` +
        `--format=json`
    );

    const _service = JSON.parse(serviceJson);
    // serviceArn would be used for more advanced IAM checks in future versions
    // const serviceArn = `projects/${projectId}/locations/${_service.metadata.namespace.split('/')[3]}/services/${apiService}`;

    console.log(`✓ Found service in location`);

    // Check IAM binding
    console.log('\n🔍 Checking IAM bindings...');
    const { stdout: iamJson } = await execAsync(
      `gcloud run services get-iam-policy ${apiService} ` +
        `--project=${projectId} ` +
        `--format=json`
    );

    const iamPolicy = JSON.parse(iamJson);
    const bindings: Array<{ role: string; members?: string[] }> = iamPolicy.bindings || [];

    // Look for roles/run.invoker binding
    const invokerBinding = bindings.find(
      (b) => b.role === 'roles/run.invoker'
    );

    if (!invokerBinding) {
      console.error('❌ Missing roles/run.invoker binding');
      return { verified: false, error: 'Invoker role not found' };
    }

    const hasFrontendSa = invokerBinding.members?.some((m: string) =>
      m.includes(frontendSaEmail)
    );

    if (!hasFrontendSa) {
      console.error(
        `❌ Frontend SA not in roles/run.invoker binding`
      );
      console.log(`   Current members: ${invokerBinding.members?.join(', ')}`);
      return { verified: false, error: 'Frontend SA not authorized' };
    }

    console.log('✓ Frontend SA has roles/run.invoker');

    // Verify audience binding (implicit)
    console.log('\n✓ Invoker role verified');
    console.log('   Frontend SA can invoke Cloud Run API ✅');

    return { verified: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Verification failed: ${errorMessage}`);
    console.log('   Ensure gcloud is authenticated and you have IAM Admin role');
    return { verified: false, error: errorMessage };
  }
}

/**
 * CLI entry point
 */
async function main() {
  const result = await verifyInvoker();

  if (result.skipped) {
    process.exit(2);
  }

  if (!result.verified) {
    console.error('\n💥 IAM verification FAILED');
    console.error('   Fix: Grant roles/run.invoker to frontend SA');
    process.exit(1);
  }

  console.log('\n✅ IAM verification PASSED\n');
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { verifyInvoker };
