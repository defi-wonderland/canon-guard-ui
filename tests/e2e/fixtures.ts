import { test as base } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { DeployCanonGuardResult } from "./utils/deployCanonGuard";
import type { DeploySafeResult } from "./utils/deploySafe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAFE_CONFIG_FILE = path.join(__dirname, ".safe-deployment.json");
const TEST_RESULTS_DIR = path.join(__dirname, "../../test-results");
const CANON_GUARD_CONFIG_FILE = path.join(TEST_RESULTS_DIR, ".canon-guard-deployment.json");

/**
 * Test fixtures for accessing the globally deployed Safe and Canon Guard
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

  /**
   * A deployed Canon Guard on the Anvil fork
   *
   * The Canon Guard is deployed ONCE in global setup and shared by all tests.
   * It is deployed for the Safe from the deployedSafe fixture.
   *
   * @example
   * ```typescript
   * test('should use Canon Guard', async ({ page, deployedSafe, deployedCanonGuard }) => {
   *   const { guardAddress } = deployedCanonGuard;
   *   // ... test code
   * });
   * ```
   */
  deployedCanonGuard: DeployCanonGuardResult;
};

/**
 * Extended Playwright test with Safe and Canon Guard deployment fixtures
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

  // eslint-disable-next-line no-empty-pattern
  deployedCanonGuard: async ({}, use) => {
    // Read Canon Guard deployment info from test-results
    if (!fs.existsSync(CANON_GUARD_CONFIG_FILE)) {
      throw new Error(
        `Canon Guard deployment config not found at ${CANON_GUARD_CONFIG_FILE}. Make sure global setup ran successfully.`,
      );
    }

    const config = JSON.parse(fs.readFileSync(CANON_GUARD_CONFIG_FILE, "utf-8"));
    const guard: DeployCanonGuardResult = {
      guardAddress: config.guardAddress,
      safeAddress: config.safeAddress,
      factoryAddress: config.factoryAddress,
      transactionHash: config.transactionHash,
    };

    console.log(`[Fixture] Using globally deployed Canon Guard: ${guard.guardAddress}`);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(guard);
  },
});

export { expect } from "@playwright/test";
