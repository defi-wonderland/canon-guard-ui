import { test as base, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { DeploymentsConfig, Deployment } from "./global-setup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_RESULTS_DIR = path.join(__dirname, "../../test-results");
const DEPLOYMENTS_CONFIG_FILE = path.join(TEST_RESULTS_DIR, ".deployments.json");

/**
 * Helper to switch the e2e provider's signing account based on the deployment index.
 * This must be called AFTER the page has navigated and the app has loaded.
 * The e2eProvider and setSigningAccount are exposed on window by the app.
 */
async function switchSigningAccount(page: Page, accountIndex: number): Promise<void> {
  await page.evaluate((index) => {
    // The app exposes these on window when IS_PLAYWRIGHT is true
    const win = window as typeof window & {
      __e2eProvider?: unknown;
      __setSigningAccount?: (provider: unknown, index: number) => void;
    };
    if (win.__e2eProvider && win.__setSigningAccount) {
      win.__setSigningAccount(win.__e2eProvider, index);
    }
  }, accountIndex);
}

/**
 * Load all deployments from the config file
 */
function loadDeployments(): Deployment[] {
  if (!fs.existsSync(DEPLOYMENTS_CONFIG_FILE)) {
    throw new Error(
      `Deployments config not found at ${DEPLOYMENTS_CONFIG_FILE}. Make sure global setup ran successfully.`,
    );
  }

  const config: DeploymentsConfig = JSON.parse(fs.readFileSync(DEPLOYMENTS_CONFIG_FILE, "utf-8"));
  return config.deployments;
}

/**
 * Test fixtures for accessing the globally deployed Safes and Canon Guards
 */
type TestFixtures = {
  /**
   * Array of all deployed Safe/Canon Guard pairs from global setup.
   * Each deployment uses a different Anvil account as owner (deployment.index = account index).
   *
   * @example
   * ```typescript
   * test('should interact with Safe', async ({ page, deployments, switchToDeployment }) => {
   *   const deployment = deployments[1];
   *   const { safeAddress } = deployment.safe;
   *   const { guardAddress } = deployment.canonGuard;
   *
   *   await page.goto('/');
   *   await switchToDeployment(deployment);
   *   // ... test code
   * });
   * ```
   */
  deployments: Deployment[];

  /**
   * Switch the e2e provider's signing account to match a deployment's owner.
   * Call this AFTER page.goto() and BEFORE any wallet interactions.
   *
   * @example
   * ```typescript
   * test('should interact', async ({ page, deployments, switchToDeployment }) => {
   *   const deployment = deployments[0];
   *   await page.goto('/');
   *   await switchToDeployment(deployment);
   *   // Now the wallet will sign with the correct account
   * });
   * ```
   */
  switchToDeployment: (deployment: Deployment) => Promise<void>;
};

/**
 * Extended Playwright test with Safe and Canon Guard deployment fixtures
 */
export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  deployments: async ({}, use) => {
    const allDeployments = loadDeployments();
    console.log(`[Fixture] Loaded ${allDeployments.length} deployments`);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(allDeployments);
  },

  switchToDeployment: async ({ page }, use) => {
    const helper = async (deployment: Deployment) => {
      console.log(`[Fixture] Switching signing account to Anvil account ${deployment.index}`);
      await switchSigningAccount(page, deployment.index);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helper);
  },
});

export { expect } from "@playwright/test";
