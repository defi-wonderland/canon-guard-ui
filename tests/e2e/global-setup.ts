import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { ANVIL_ACCOUNT_ADDRESS, ANVIL_RPC_URL, CANON_GUARD_CONFIG } from "./constants";
import { deployCanonGuard } from "./utils/deployCanonGuard";
import { deploySafe } from "./utils/deploySafe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAFE_CONFIG_FILE = path.join(__dirname, ".safe-deployment.json");
const TEST_RESULTS_DIR = path.join(__dirname, "../../test-results");
const CANON_GUARD_CONFIG_FILE = path.join(TEST_RESULTS_DIR, ".canon-guard-deployment.json");

/**
 * Global setup: Deploy Safe and Canon Guard once before all tests
 */
async function globalSetup() {
  console.log("[Global Setup] Deploying Safe...");

  try {
    // Step 1: Deploy Safe
    const safe = await deploySafe({
      rpcUrl: ANVIL_RPC_URL,
      threshold: 1,
    });

    console.log(`[Global Setup] Safe deployed at: ${safe.safeAddress}`);

    // Store Safe deployment info
    fs.writeFileSync(
      SAFE_CONFIG_FILE,
      JSON.stringify(
        {
          safeAddress: safe.safeAddress,
          owners: safe.owners,
          threshold: safe.threshold,
          transactionHash: safe.transactionHash,
        },
        null,
        2,
      ),
    );

    console.log(`[Global Setup] Safe deployment info saved to ${SAFE_CONFIG_FILE}`);

    // Step 2: Deploy Canon Guard
    console.log("[Global Setup] Deploying Canon Guard...");

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

    console.log(`[Global Setup] Canon Guard deployed at: ${guard.guardAddress}`);

    // Ensure test-results directory exists
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
    }

    // Store Canon Guard deployment info
    fs.writeFileSync(
      CANON_GUARD_CONFIG_FILE,
      JSON.stringify(
        {
          guardAddress: guard.guardAddress,
          safeAddress: guard.safeAddress,
          factoryAddress: guard.factoryAddress,
          transactionHash: guard.transactionHash,
        },
        null,
        2,
      ),
    );

    console.log(`[Global Setup] Canon Guard deployment info saved to ${CANON_GUARD_CONFIG_FILE}`);
  } catch (error) {
    console.error("[Global Setup] Failed to deploy:", error);
    throw error;
  }
}

export default globalSetup;
