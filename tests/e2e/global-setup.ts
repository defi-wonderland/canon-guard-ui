import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { deploySafe } from "./utils/deploySafe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAFE_CONFIG_FILE = path.join(__dirname, ".safe-deployment.json");

/**
 * Global setup: Deploy Safe once before all tests
 */
async function globalSetup() {
  console.log("[Global Setup] Deploying Safe...");

  try {
    const safe = await deploySafe({
      rpcUrl: "http://127.0.0.1:8545",
      threshold: 1,
    });

    console.log(`[Global Setup] Safe deployed at: ${safe.safeAddress}`);

    // Store deployment info for tests to access
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

    console.log(`[Global Setup] Deployment info saved to ${SAFE_CONFIG_FILE}`);
  } catch (error) {
    console.error("[Global Setup] Failed to deploy Safe:", error);
    throw error;
  }
}

export default globalSetup;
