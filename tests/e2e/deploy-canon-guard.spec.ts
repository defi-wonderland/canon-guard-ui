import { ANVIL_ACCOUNTS, CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";
import { selectChain } from "./utils/selectChain";
import { selectOption } from "./utils/selectOption";

// Use serial execution since we modify the Safe state
test.describe.serial("In-App Canon Guard Deployment", () => {
  test("should deploy a Canon Guard within the app and attach it to a Safe", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[1];
    const { safeAddress } = deployment.safe;

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify wallet section is visible in header on initial setup screen
    await expect(page.getByTestId("header-wallet-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 2: Enter the Safe address
    await page.getByTestId("safe-address-input").fill(safeAddress);

    // Step 3: Select OP Mainnet chain
    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Step 4: Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Step 5: Wait for the choice screen to appear and click "Deploy New Canon Guard"
    await expect(page.getByTestId("no-guard-message")).toBeVisible({
      timeout: TEST_TIMEOUTS.LONG,
    });

    // Verify wallet section is still visible in header on choice screen
    await expect(page.getByTestId("header-wallet-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    await page.getByTestId("deploy-new-guard-button").click();

    // Step 6: Fill in the Guard Setup Wizard (Step 1: Configure)
    // Wait for the wizard to appear by checking for emergency trigger input
    await expect(page.getByTestId("emergency-trigger-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify wallet section is visible in header on wizard configure step
    await expect(page.getByTestId("header-wallet-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Set short delay values for testing (1 second each)
    // Short execution delay: 1 second
    await page.getByTestId("shortTxExecutionDelay-input").fill("1");
    await selectOption(page, page.getByTestId("shortTxExecutionDelay-select"), "seconds");

    // Long execution delay: 2 seconds (Change Guard uses this path)
    await page.getByTestId("longTxExecutionDelay-input").fill("2");
    await selectOption(page, page.getByTestId("longTxExecutionDelay-select"), "seconds");

    // Use the owner address for emergency trigger and caller
    const emergencyAddress = ANVIL_ACCOUNTS[deployment.index].address;
    await page.getByTestId("emergency-trigger-input").fill(emergencyAddress);
    await page.getByTestId("emergency-caller-input").fill(emergencyAddress);

    // Click Continue to proceed to Step 2 (Deploy)
    await page.getByTestId("wizard-continue-button").click();

    // Step 7: Deploy Canon Guard (Step 2 of wizard)
    await expect(page.getByTestId("guard-setup-wizard")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("deploy-guard-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify wallet section is visible in header on wizard deploy step
    await expect(page.getByTestId("header-wallet-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    await page.getByTestId("deploy-guard-button").click();

    // Step 8: Wait for deployment to complete
    await expect(page.getByTestId("deploy-success-message")).toBeVisible({
      timeout: TEST_TIMEOUTS.TRANSACTION,
    });

    // Step 9: Wait for auto-redirect and verify app loads in detached mode
    await expect(page.getByTestId("queue-search-input")).toBeVisible({
      timeout: TEST_TIMEOUTS.LONG,
    });
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 10: Click "Learn more" link to open the deployment modes panel
    await page.getByTestId("learn-more-link").click();

    // Step 11: Verify the Deployment Modes Panel opens and click "Attach Canon Guard"
    await expect(page.getByTestId("deployment-modes-panel")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("attach-guard-button").click();
    await page.waitForTimeout(1000);

    // Step 12: Sign the attach transactions (3 steps: Deploy, Queue, Sign)
    for (let i = 1; i <= 3; i++) {
      await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
      await page.getByTestId("sign-button").click();
      await expect(page.getByText(`${i}/3`)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    }

    await page.waitForTimeout(2000);

    // Step 13: Click 'View Queue' to go back to the queue
    await page.getByTestId("view-queue-button").click();

    // Step 14: Verify we're on the home page with queue list visible
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("create-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 15: Wait for cooldown to expire (we set 2 second long delay)
    // The UI needs time to poll and update the button state
    await page.waitForTimeout(2000);

    // Step 16: Execute the attach transaction
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("execute-button")).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();

    // Wait for page reload to complete (CHANGE_SAFE_GUARD action triggers window.location.href)
    await page.waitForURL(/\/queue/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 17: Verify we're on the home page after execution
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("create-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // CRITICAL: Wait for the detached banner to disappear (confirms isDetached state is false)
    // This prevents race condition where we navigate to Settings before state has fully updated
    await expect(page.getByTestId("detached-mode-banner")).not.toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 18: Navigate to Settings and verify guard is attached
    await page.getByTestId("header-safe-dropdown-button").click();

    // Wait for the dropdown menu to be visible
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    await page.getByTestId("settings-menu-item").click();

    // Wait for navigation to complete
    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify we're on the Settings page
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Wait for Canon Guard status to reflect attachment
    await expect(page.getByTestId("settings-detach-button")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    await expect(page.getByTestId("canon-guard-status-label")).toHaveText("Attached", {
      timeout: TEST_TIMEOUTS.TRANSACTION,
    });
  });

  test("should add another Safe from the Manage Safe Accounts page", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[1];
    const { safeAddress } = deployment.safe;

    // Get the Safe from deployment 0 (which has an attached guard from attach-canon-guard tests)
    const otherDeployment = deployments[0];
    const otherSafeAddress = otherDeployment.safe.safeAddress;

    // Step 1: Navigate to the app (each test gets a fresh browser context, so localStorage is empty)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Step 2: Go through the setup form to save the Safe to localStorage
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Enter the Safe address
    await page.getByTestId("safe-address-input").fill(safeAddress);

    // Select OP Mainnet chain
    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue - this saves the Safe to localStorage
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Step 3: Wait for the main app to load (Safe should have guard attached from previous test)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Click on the Safe dropdown button in the header
    await page.getByTestId("header-safe-dropdown-button").click();

    // Wait for the dropdown menu to be visible
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 4: Click "Manage Safe Accounts" in the dropdown
    await page.getByTestId("manage-safes-menu-item").click();

    // Wait for navigation to complete
    await page.waitForURL(/\/settings\/safes/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 5: Verify we're on the Manage Safes page
    await expect(page.getByTestId("manage-safes-page")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("current-safe-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByTestId("current-safe-card")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 6: Click "Add New Safe" button
    await page.getByTestId("add-new-safe-button").click();

    // Step 7: Wait for the setup form to appear
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 8: Enter the other Safe address (from deployment 0)
    await page.getByTestId("safe-address-input").fill(otherSafeAddress);

    // Step 9: Select OP Mainnet chain
    const chainSelector2 = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector2, CHAIN_CONFIG.OP_MAINNET.label);

    // Step 10: Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Step 11: Handle the case where the Safe doesn't have a guard attached yet
    // (this can happen if attach-canon-guard tests haven't run first)
    const noGuardMessage = page.getByTestId("no-guard-message");
    const queueSearchInput = page.getByTestId("queue-search-input");

    // Wait for either the queue or the no-guard choice screen
    await expect(noGuardMessage.or(queueSearchInput)).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // If we see the no-guard choice screen, use the existing Canon Guard
    if (await noGuardMessage.isVisible()) {
      await page.getByTestId("use-existing-guard-button").click();

      // Enter the Canon Guard address from deployment 0
      await expect(page.getByTestId("guard-address-label")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
      await page.getByTestId("guard-address-input").fill(otherDeployment.canonGuard.guardAddress);

      // Wait for validation and click Continue
      const guardContinueButton = page.getByTestId("guard-continue-button");
      await expect(guardContinueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
      await guardContinueButton.click();

      // Wait for the queue to load
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    }

    // Step 12: Go back to Manage Safes to verify the previous safe is now in the list
    await page.getByTestId("header-safe-dropdown-button").click();
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("manage-safes-menu-item").click();

    // Wait for navigation
    await page.waitForURL(/\/settings\/safes/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 13: Verify the Manage Safes page shows both safes
    await expect(page.getByTestId("manage-safes-page")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("current-safe-card")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // The previous safe should now appear in the "Previously Used" section
    await expect(page.getByTestId("previous-safes-section")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("previous-safe-card-0")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
  });
});
