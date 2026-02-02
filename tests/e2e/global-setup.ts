import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { ANVIL_ACCOUNT_ADDRESS, ANVIL_RPC_URL, CANON_GUARD_CONFIG } from "./constants";
import { deployCanonGuard, DeployCanonGuardResult } from "./utils/deployCanonGuard";
import { deploySafe, DeploySafeResult } from "./utils/deploySafe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_RESULTS_DIR = path.join(__dirname, "../../test-results");
const DEPLOYMENTS_CONFIG_FILE = path.join(TEST_RESULTS_DIR, ".deployments.json");

/**
 * Number of parallel Safe/CanonGuard pairs to deploy
 * Each test file can use a different index to run in parallel
 */
const NUM_DEPLOYMENTS = 2;

/**
 * A single deployment containing both Safe and Canon Guard
 */
export interface Deployment {
  index: number;
  safe: DeploySafeResult;
  canonGuard: DeployCanonGuardResult;
}

/**
 * All deployments stored in the config file
 */
export interface DeploymentsConfig {
  deployments: Deployment[];
}

/**
 * Global setup: Deploy multiple Safe/Canon Guard pairs for parallel test execution
 */
async function globalSetup() {
  console.log(`[Global Setup] Deploying ${NUM_DEPLOYMENTS} Safe/Canon Guard pairs...`);

  try {
    // Ensure test-results directory exists
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
    }

    const deployments: Deployment[] = [];

    for (let i = 0; i < NUM_DEPLOYMENTS; i++) {
      console.log(`\n[Global Setup] === Deployment ${i} ===`);

      // Step 1: Deploy Safe
      console.log(`[Global Setup] Deploying Safe ${i}...`);
      const safe = await deploySafe({
        rpcUrl: ANVIL_RPC_URL,
        threshold: 1,
      });
      console.log(`[Global Setup] Safe ${i} deployed at: ${safe.safeAddress}`);

      // Step 2: Deploy Canon Guard
      console.log(`[Global Setup] Deploying Canon Guard ${i}...`);
      const guard = await deployCanonGuard({
        rpcUrl: ANVIL_RPC_URL,
        safeAddress: safe.safeAddress,
        shortTxExecutionDelay: CANON_GUARD_CONFIG.shortTxExecutionDelay,
        longTxExecutionDelay: CANON_GUARD_CONFIG.longTxExecutionDelay,
        txExpiryDelay: CANON_GUARD_CONFIG.txExpiryDelay,
        maxApprovalDuration: CANON_GUARD_CONFIG.maxApprovalDuration,
        emergencyTrigger: ANVIL_ACCOUNT_ADDRESS,
        emergencyCaller: ANVIL_ACCOUNT_ADDRESS,
      });
      console.log(`[Global Setup] Canon Guard ${i} deployed at: ${guard.guardAddress}`);

      deployments.push({
        index: i,
        safe,
        canonGuard: guard,
      });
    }

    // Store all deployments info
    const config: DeploymentsConfig = { deployments };
    fs.writeFileSync(DEPLOYMENTS_CONFIG_FILE, JSON.stringify(config, null, 2));

    console.log(`\n[Global Setup] All ${NUM_DEPLOYMENTS} deployments saved to ${DEPLOYMENTS_CONFIG_FILE}`);
  } catch (error) {
    console.error("[Global Setup] Failed to deploy:", error);
    throw error;
  }
}

export default globalSetup;
