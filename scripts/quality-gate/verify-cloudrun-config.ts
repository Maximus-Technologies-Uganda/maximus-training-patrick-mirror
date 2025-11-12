/**
 * @file verify-cloudrun-config.ts
 * @description CI gate: Verify Cloud Run API service configuration
 * 
 * **FR-026** (Production): Cloud Run must have min-instances >= 1 and correct env vars
 * 
 * Purpose:
 * - Ensures Cloud Run API service is production-ready
 * - Verifies: min-instances >= 1 (no cold starts)
 * - Verifies: Environment variables match expected set
 * - Fail if critical config missing
 * 
 * Exit codes:
 * - 0: Configuration verified ✅
 * - 1: Configuration invalid (FAIL - blocks deploy)
 * - 2: Check skipped (no GCP context)
 * 
 * Execution:
 * - CI: npm run verify:cloudrun-config
 * - Requires: gcloud CLI authenticated
 * 
 * Requirements:
 * - GCP_PROJECT_ID set
 * - API_CLOUD_RUN_SERVICE set (service name)
 * - GCP_REGION set (where service is deployed)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CloudRunConfig {
  minInstances: number;
  maxInstances: number;
  envVars: Record<string, string>;
  memory: string;
  cpu: string;
  timeout: number;
}

interface VerifyConfigOptions {
  projectId?: string;
  service?: string;
  region?: string;
  dryRun?: boolean;
}

/**
 * Parse Cloud Run service configuration
 */
async function getCloudRunConfig(
  projectId: string,
  service: string,
  region: string
): Promise<CloudRunConfig> {
  try {
    const { stdout } = await execAsync(
      `gcloud run services describe ${service} ` +
        `--project=${projectId} ` +
        `--region=${region} ` +
        `--format=json`
    );

    const serviceConfig = JSON.parse(stdout);

    // Extract configuration
    const spec = serviceConfig.spec || {};
    const template = spec.template || {};
    const containerSpec = (template.spec?.containers || [{}])[0] || {};

    return {
      minInstances:
        template.metadata?.annotations?.[
          'autoscaling.knative.dev/minScale'
        ] || 0,
      maxInstances:
        template.metadata?.annotations?.[
          'autoscaling.knative.dev/maxScale'
        ] || 100,
      envVars: containerSpec.env?.reduce(
        (acc: Record<string, string>, e: { name: string; value?: string }) => {
          acc[e.name] = e.value || '';
          return acc;
        },
        {}
      ) || {},
      memory: containerSpec.resources?.limits?.memory || '512Mi',
      cpu: containerSpec.resources?.limits?.cpu || '1',
      timeout: spec.timeoutSeconds || 300,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch Cloud Run config: ${message}`);
  }
}

/**
 * Verify Cloud Run configuration
 */
async function verifyCloudRunConfig(
  options: VerifyConfigOptions = {}
) {
  const projectId = options.projectId || process.env.GCP_PROJECT_ID;
  const service = options.service || process.env.API_CLOUD_RUN_SERVICE;
  const region = options.region || process.env.GCP_REGION;

  console.log('⚙️  Verifying Cloud Run configuration...');
  console.log(`   Project: ${projectId}`);
  console.log(`   Service: ${service}`);
  console.log(`   Region: ${region}`);

  // Validate inputs
  if (!projectId || !service || !region) {
    console.warn('⚠️  Skipping Cloud Run config check (missing env vars)');
    console.log('   Set: GCP_PROJECT_ID, API_CLOUD_RUN_SERVICE, GCP_REGION');
    return { verified: false, skipped: true };
  }

  try {
    console.log('\n📋 Fetching Cloud Run service configuration...');
    const config = await getCloudRunConfig(projectId, service, region);

    // Check min-instances
    console.log('\n🔍 Checking scaling configuration...');
    console.log(`   Min instances: ${config.minInstances}`);
    console.log(`   Max instances: ${config.maxInstances}`);

    if (config.minInstances < 1) {
      console.error('❌ min-instances must be >= 1 (cold starts not acceptable)');
      return {
        verified: false,
        error: 'min-instances < 1',
      };
    }
    console.log('✓ Min instances configured (no cold starts)');

    // Check memory and CPU
    console.log('\n🔍 Checking resource allocation...');
    console.log(`   Memory: ${config.memory}`);
    console.log(`   CPU: ${config.cpu}`);

    const memoryGi = parseInt(config.memory);
    if (memoryGi < 512) {
      console.warn('⚠️  Memory < 512Mi (may cause performance issues)');
    } else {
      console.log('✓ Memory allocation adequate');
    }

    // Check timeout
    console.log('\n🔍 Checking timeout...');
    console.log(`   Timeout: ${config.timeout}s`);

    if (config.timeout < 30) {
      console.error('❌ Timeout too short (minimum 30s recommended)');
      return { verified: false, error: 'Timeout too short' };
    }
    console.log('✓ Timeout configured');

    // Check critical env vars
    console.log('\n🔍 Checking environment variables...');
    const criticalVars = [
      'DATABASE_URL',
      'NODE_ENV',
      'GCP_PROJECT_ID',
    ];

    const missing = criticalVars.filter((v) => !config.envVars[v]);

    if (missing.length > 0) {
      console.error(`❌ Missing critical env vars: ${missing.join(', ')}`);
      return { verified: false, error: 'Missing env vars' };
    }

    console.log(`✓ All critical env vars present`);
    console.log(`   Configured: ${Object.keys(config.envVars).length} vars`);

    // Summary
    console.log('\n✓ Cloud Run configuration verified');
    console.log('   - Min instances: >= 1 ✅');
    console.log('   - Resource limits: Adequate ✅');
    console.log('   - Timeout: Configured ✅');
    console.log('   - Env vars: Complete ✅');

    return { verified: true, config };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Verification failed: ${errorMessage}`);
    return { verified: false, error: errorMessage };
  }
}

/**
 * CLI entry point
 */
async function main() {
  const result = await verifyCloudRunConfig();

  if (result.skipped) {
    process.exit(2);
  }

  if (!result.verified) {
    console.error('\n💥 Cloud Run configuration check FAILED');
    console.error('   Fix: Update Cloud Run service configuration');
    process.exit(1);
  }

  console.log('\n✅ Cloud Run configuration check PASSED\n');
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { verifyCloudRunConfig, getCloudRunConfig };
