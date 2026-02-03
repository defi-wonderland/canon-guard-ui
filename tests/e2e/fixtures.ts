import { test as base, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { DeploymentsConfig, Deployment } from "./global-setup";
import type { DeployCanonGuardResult } from "./utils/deployCanonGuard";
import type { DeploySafeResult } from "./utils/deploySafe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_RESULTS_DIR = path.join(__dirname, "../../test-results");
const DEPLOYMENTS_CONFIG_FILE = path.join(TEST_RESULTS_DIR, ".deployments.json");

/**
 * Helper to switch the e2e provider's signing account based on the deployment's owner index.
 * This must be called AFTER the page has navigated and the app has loaded.
 * The e2eProvider and setSigningAccount are exposed on window by the app.
 */
async function switchSigningAccount(page: Page, ownerIndex: number): Promise<void> {
  await page.evaluate((index) => {
    // The app exposes these on window when IS_PLAYWRIGHT is true
    const win = window as typeof window & {
      __e2eProvider?: unknown;
      __setSigningAccount?: (provider: unknown, index: number) => void;
    };
    if (win.__e2eProvider && win.__setSigningAccount) {
      win.__setSigningAccount(win.__e2eProvider, index);
    }
  }, ownerIndex);
}

/**
 * Worker-scoped options for configuring which deployment to use
 */
type WorkerOptions = {
  /**
   * The index of the deployment to use (0, 1, 2, ...)
   * Each test file can specify a different index to run in parallel
   */
  deploymentIndex: number;
};

/**
 * Test fixtures for accessing the globally deployed Safe and Canon Guard
 */
type TestFixtures = {
  /**
   * A deployed 1/1 Safe wallet on the Anvil fork
   *
   * The Safe is deployed ONCE in global setup and shared by all tests using the same deploymentIndex.
   * Each deployment uses a different Anvil account as owner to avoid nonce conflicts.
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
   * The Canon Guard is deployed ONCE in global setup and shared by all tests using the same deploymentIndex.
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

  /**
   * The Anvil account index used as the owner for this deployment.
   * Use this with setSigningAccountForDeployment to switch the wallet.
   */
  ownerIndex: number;

  /**
   * Switch the e2e provider's signing account to match this deployment's owner.
   * Call this AFTER page.goto() and BEFORE any wallet interactions.
   *
   * @example
   * ```typescript
   * test('should interact', async ({ page, setSigningAccountForDeployment }) => {
   *   await page.goto('/');
   *   await setSigningAccountForDeployment();
   *   // Now the wallet will sign with the correct account
   * });
   * ```
   */
  setSigningAccountForDeployment: () => Promise<void>;
};

/**
 * Helper function to load a deployment by index
 */
function loadDeployment(index: number): Deployment {
  if (!fs.existsSync(DEPLOYMENTS_CONFIG_FILE)) {
    throw new Error(
      `Deployments config not found at ${DEPLOYMENTS_CONFIG_FILE}. Make sure global setup ran successfully.`,
    );
  }

  const config: DeploymentsConfig = JSON.parse(fs.readFileSync(DEPLOYMENTS_CONFIG_FILE, "utf-8"));

  if (index < 0 || index >= config.deployments.length) {
    throw new Error(`Deployment index ${index} is out of range. Available: 0-${config.deployments.length - 1}`);
  }

  return config.deployments[index];
}

/**
 * Extended Playwright test with Safe and Canon Guard deployment fixtures
 * Supports multiple deployments for parallel test execution
 */
export const test = base.extend<TestFixtures, WorkerOptions>({
  // Worker-scoped option: which deployment index to use (default: 0)
  deploymentIndex: [0, { option: true, scope: "worker" }],

  deployedSafe: async ({ deploymentIndex }, use) => {
    const deployment = loadDeployment(deploymentIndex);
    const safe = deployment.safe;

    console.log(`[Fixture] Using deployment ${deploymentIndex} - Safe: ${safe.safeAddress}`);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(safe);
  },

  deployedCanonGuard: async ({ deploymentIndex }, use) => {
    const deployment = loadDeployment(deploymentIndex);
    const guard = deployment.canonGuard;

    console.log(`[Fixture] Using deployment ${deploymentIndex} - Canon Guard: ${guard.guardAddress}`);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(guard);
  },

  ownerIndex: async ({ deploymentIndex }, use) => {
    const deployment = loadDeployment(deploymentIndex);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(deployment.ownerIndex);
  },

  setSigningAccountForDeployment: async ({ page, ownerIndex }, use) => {
    const helper = async () => {
      console.log(`[Fixture] Switching signing account to Anvil account ${ownerIndex}`);
      await switchSigningAccount(page, ownerIndex);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helper);
  },
});

export { expect } from "@playwright/test";
