import { test as base } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { DeploySafeResult } from "./utils/deploySafe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAFE_CONFIG_FILE = path.join(__dirname, ".safe-deployment.json");

/**
 * Test fixtures for accessing the globally deployed Safe
 */
export type TestFixtures = {
  /**
   * A deployed 1/1 Safe wallet on the Anvil fork
   *
   * The Safe is deployed ONCE in global setup and shared by all tests.
   * Owner: Anvil account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
   *
   * @example
   * ```typescript
   * test('should interact with Safe', async ({ page, deployedSafe }) => {
   *   const { safeAddress } = deployedSafe;
   *   await page.goto(`/?chainId=10&safeAddress=${safeAddress}`);
   *   // ... test code
   * });
   * ```
   */
  deployedSafe: DeploySafeResult;
};

/**
 * Extended Playwright test with Safe deployment fixture
 */
export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  deployedSafe: async ({}, use) => {
    // Read deployment info from global setup
    if (!fs.existsSync(SAFE_CONFIG_FILE)) {
      throw new Error(
        `Safe deployment config not found at ${SAFE_CONFIG_FILE}. Make sure global setup ran successfully.`,
      );
    }

    const config = JSON.parse(fs.readFileSync(SAFE_CONFIG_FILE, "utf-8"));
    const safe: DeploySafeResult = {
      safeAddress: config.safeAddress,
      owners: config.owners,
      threshold: config.threshold,
      transactionHash: config.transactionHash,
    };

    console.log(`[Fixture] Using globally deployed Safe: ${safe.safeAddress}`);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(safe);
  },
});

export { expect } from "@playwright/test";
