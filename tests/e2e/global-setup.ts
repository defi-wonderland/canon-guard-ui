import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
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
      rpcUrl: "http://127.0.0.1:8545",
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
      rpcUrl: "http://127.0.0.1:8545",
      safeAddress: safe.safeAddress,
      shortTxExecutionDelay: 1n, // 1 second for testing
      longTxExecutionDelay: 2n, // 2 seconds for testing
      txExpiryDelay: 604800n, // 7 days
      maxApprovalDuration: 10368000n, // ~4 months
      emergencyTrigger: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      emergencyCaller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
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
