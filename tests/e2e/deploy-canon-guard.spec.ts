import { ANVIL_ACCOUNTS, CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";

// Use deployment index 1 to avoid conflicts with attach-canon-guard tests (index 0)
test.use({ deploymentIndex: 1 });

// Use serial execution since we modify the Safe state
test.describe.serial("In-App Canon Guard Deployment", () => {
  test("should deploy a Canon Guard within the app and attach it to a Safe", async ({
    page,
    deployedSafe,
    ownerIndex,
    setSigningAccountForDeployment,
  }) => {
    const { safeAddress } = deployedSafe;

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await setSigningAccountForDeployment();

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify wallet section is visible in header on initial setup screen
    await expect(page.getByTestId("header-wallet-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 2: Enter the Safe address
    await page.getByTestId("safe-address-input").fill(safeAddress);

    // Step 3: Select OP Mainnet chain
    const chainSelector = page.getByTestId("chain-selector");
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

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
    await page.getByTestId("shortTxExecutionDelay-select").selectOption("seconds");

    // Long execution delay: 2 seconds (Change Guard uses this path)
    await page.getByTestId("longTxExecutionDelay-input").fill("2");
    await page.getByTestId("longTxExecutionDelay-select").selectOption("seconds");

    // Use the owner address for emergency trigger and caller
    const emergencyAddress = ANVIL_ACCOUNTS[ownerIndex].address;
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

    await page.waitForTimeout(1000);

    // Step 13: Click 'View Queue' to go back to the queue
    await page.getByTestId("view-queue-button").click();

    // Step 14: Verify we're on the home page with queue list visible
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("create-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 15: Wait for cooldown to expire (we set 2 second long delay)
    // The UI needs time to poll and update the button state
    await page.waitForTimeout(5000);

    // Step 16: Execute the attach transaction
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("execute-button")).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();
    await page.waitForTimeout(1000);

    // Step 17: Verify we're still on the home page after execution
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("create-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 18: Navigate to Settings and verify guard is attached
    await page.getByTestId("header-safe-dropdown-button").click();

    // Wait for the dropdown menu to be visible
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    await page.getByTestId("settings-menu-item").click();

    // Wait for navigation to complete
    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify we're on the Settings page
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify the Canon Guard shows as "Attached"
    await expect(page.getByTestId("canon-guard-status-label")).toHaveText("Attached", {
      timeout: TEST_TIMEOUTS.SHORT,
    });
  });
});
