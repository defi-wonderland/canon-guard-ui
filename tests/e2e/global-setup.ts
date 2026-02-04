import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { ANVIL_ACCOUNTS, ANVIL_RPC_URL, CANON_GUARD_CONFIG } from "./constants";
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
const NUM_DEPLOYMENTS = 3;

/**
 * A single deployment containing both Safe and Canon Guard
 */
export interface Deployment {
  index: number;
  /** The Anvil account index used as the owner for this deployment */
  ownerIndex: number;
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
      // Use a different Anvil account for each deployment to avoid nonce conflicts
      const ownerIndex = i % ANVIL_ACCOUNTS.length;
      const ownerAccount = ANVIL_ACCOUNTS[ownerIndex];

      console.log(`\n[Global Setup] === Deployment ${i} (Owner: Account ${ownerIndex}) ===`);

      // Step 1: Deploy Safe with the specific owner
      console.log(`[Global Setup] Deploying Safe ${i} with owner ${ownerAccount.address}`);
      const safe = await deploySafe({
        rpcUrl: ANVIL_RPC_URL,
        threshold: 1,
        ownerPrivateKey: ownerAccount.privateKey,
      });
      console.log(`[Global Setup] Safe ${i} deployed at: ${safe.safeAddress}`);

      // Step 2: Deploy Canon Guard using the same owner
      console.log(`[Global Setup] Deploying Canon Guard ${i}`);
      const guard = await deployCanonGuard({
        rpcUrl: ANVIL_RPC_URL,
        safeAddress: safe.safeAddress,
        shortTxExecutionDelay: CANON_GUARD_CONFIG.shortTxExecutionDelay,
        longTxExecutionDelay: CANON_GUARD_CONFIG.longTxExecutionDelay,
        txExpiryDelay: CANON_GUARD_CONFIG.txExpiryDelay,
        maxApprovalDuration: CANON_GUARD_CONFIG.maxApprovalDuration,
        emergencyTrigger: ownerAccount.address,
        emergencyCaller: ownerAccount.address,
        deployerPrivateKey: ownerAccount.privateKey,
      });
      console.log(`[Global Setup] Canon Guard ${i} deployed at: ${guard.guardAddress}`);

      deployments.push({
        index: i,
        ownerIndex,
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
