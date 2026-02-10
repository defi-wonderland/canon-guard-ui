import { ANVIL_ACCOUNTS, CHAIN_CONFIG, TEST_TIMEOUTS, USDC_OPTIMISM } from "./constants";
import { test, expect } from "./fixtures";
import { fundSafe } from "./utils/fundSafe";
import { selectChain } from "./utils/selectChain";

// Use serial execution to ensure tests run in order within this file
test.describe.serial("Settings Attach Flow", () => {
  test("should attach an existing Canon Guard via Settings page", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;
    const { guardAddress } = deployment.canonGuard;

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address
    await page.getByTestId("safe-address-input").fill(safeAddress);

    // Step 3: Select OP Mainnet chain
    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Step 4: Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Step 5: Wait for the choice screen to appear and click "Use Existing Canon Guard"
    await expect(page.getByTestId("no-guard-message")).toBeVisible({
      timeout: TEST_TIMEOUTS.LONG,
    });
    await page.getByTestId("use-existing-guard-button").click();

    // Step 6: Enter the Canon Guard address
    await expect(page.getByTestId("guard-address-label")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("guard-address-input").fill(guardAddress);

    // Step 7: Wait for validation and click Continue
    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Step 8: Verify app loads in detached mode with the warning banner
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 9: Click on the Safe dropdown in the header
    await page.getByTestId("header-safe-dropdown-button").click();

    // Wait for the dropdown menu to be visible
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 10: Click on "Settings" in the dropdown menu
    await page.getByTestId("settings-menu-item").click();

    // Step 11: Wait for navigation and Settings page to load
    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 12: Click "ATTACH" button in the Canon Guard section
    await page.getByTestId("settings-attach-button").click();

    // Step 13: Wait for the attach flow page to load
    await page.waitForTimeout(1000);

    // Step 14: Sign the first transaction (Deploy Attach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the first transaction to complete
    await expect(page.getByText("1/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Step 15: Sign the second transaction (Queue Attach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    await expect(page.getByText("2/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Step 16: Sign the third transaction (Sign Attach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    await expect(page.getByText("3/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1000);

    // Step 17: Click "View Queue" to go back to the queue
    await page.getByTestId("view-queue-button").click();

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 18: The transaction needs to be executed
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();

    // Wait for page reload to complete (CHANGE_SAFE_GUARD action triggers window.location.href)
    await page.waitForURL(/\/queue/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Wait for queue to load and verify detached banner is gone (confirms guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("detached-mode-banner")).not.toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
  });

  test("should create and execute a transfer action", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;

    // Step 1: Fund the Safe with USDC before the test
    await fundSafe({
      safeAddress: safeAddress as `0x${string}`,
      amount: "1000", // 1000 USDC
    });

    // Step 2: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 3: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 4: Click 'CREATE' in the header
    await page.getByTestId("create-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Create page
    await expect(page.getByTestId("create-page-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 5: Click 'New Action'
    await page.getByTestId("new-action-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Select Factory page
    await expect(page.getByTestId("select-factory-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 6: Click 'Transfer' option
    await page.getByTestId("transfer-option").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Transfer form
    await expect(page.getByTestId("transfer-title-card")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 7: Fill in the form fields
    // Title
    await page.getByTestId("transfer-title-input").fill("Test USDC Transfer");

    // Token address (USDC on Optimism)
    await page.getByTestId("transfer-token-address-input").fill(USDC_OPTIMISM);

    // Recipient address (use Anvil account for this deployment)
    await page.getByTestId("transfer-recipient-address-input").fill(ANVIL_ACCOUNTS[deployment.index].address);

    // Amount (10 USDC - in smallest unit)
    await page.getByTestId("transfer-amount-input").fill("10");

    // Step 8: Click Continue
    await page.getByTestId("transfer-form-continue-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Review page
    await expect(page.getByTestId("preview-action-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("Test USDC Transfer")).toBeVisible();

    // Step 9: Click Initiate
    await page.getByTestId("initiate-button").click();
    await page.waitForTimeout(1000);

    // Step 10: Sign the four transactions
    // Transaction 1/4: Deploy Transfer Action
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("1/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 2/4: Save to Canon List
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("2/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 3/4: Queue Transaction
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("3/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 4/4: Sign Transaction
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("4/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1000);

    // Step 11: Click 'View Queue'
    await page.getByTestId("view-queue-button").click();

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("queue-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 12: Look for the item in "Ready to Execute" section and click Execute
    await expect(page.getByTestId("ready-to-execute-section")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Find and click the Execute button
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("execute-button").click();

    // Wait for execution to complete
    await page.waitForTimeout(1000);
  });

  test("should queue and execute a transfer from Canon List", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Click 'CANON LIST' in the header to navigate to saved actions
    await page.getByTestId("canon-list-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Canon List page by checking the page title
    await expect(page.getByTestId("canon-list-title")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Wait for the list to load
    await page.waitForTimeout(1000);

    // Step 4: Find the saved "Test USDC Transfer" action and click QUEUE
    // The action from the previous test should be visible
    await expect(page.getByText("Test USDC Transfer")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Click the QUEUE button on the first action item
    await page.getByTestId("canon-list-queue-button").first().click();

    await page.waitForTimeout(1000);

    // Step 5: We should now be on the Queue Action flow
    // Sign the queue transaction (2 steps: Queue + Sign)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("1/2")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Sign transaction 2/2
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("2/2")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1000);

    // Step 6: Click 'View Queue' to navigate to the queue
    await page.getByTestId("view-queue-button").click();

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("queue-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 7: Look for the item in "Ready to Execute" section and click Execute
    await expect(page.getByTestId("ready-to-execute-section")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Find and click the Execute button
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("execute-button").click();

    // Wait for execution to complete
    await page.waitForTimeout(1000);
  });

  test("should activate emergency mode from Settings page", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner (also emergency trigger/caller)
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for queue page (guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("detached-mode-banner")).not.toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 3: Navigate to Settings
    await page.getByTestId("header-safe-dropdown-button").click();
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-menu-item").click();

    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 4: Open Emergency Mode panel
    await expect(page.getByTestId("emergency-mode-status-label")).toHaveText("OFF", { timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-emergency-edit-button").click();

    await expect(page.getByTestId("settings-emergency-mode-panel")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByTestId("settings-emergency-mode-panel-status-title")).toHaveText("Emergency Mode: OFF", {
      timeout: TEST_TIMEOUTS.SHORT,
    });

    // Step 5: Activate emergency mode
    await page.getByTestId("settings-activate-emergency-mode-button").click();

    // Panel closes after tx confirmation and config refresh
    await expect(page.getByTestId("settings-emergency-mode-panel")).not.toBeVisible({
      timeout: TEST_TIMEOUTS.TRANSACTION,
    });

    // Step 6: Verify emergency mode is enabled in Settings and banner is shown
    await expect(page.getByTestId("emergency-mode-status-label")).toHaveText("ON", { timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByText("Emergency Mode Activated")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
  });

  test("should deactivate emergency mode from Settings page", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;

    // Step 1: Navigate to the app (emergency mode was activated in previous test)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner (also emergency caller)
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for queue page and verify emergency banner is visible
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByText("Emergency Mode Activated")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Navigate to Settings
    await page.getByTestId("header-safe-dropdown-button").click();
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-menu-item").click();

    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 4: Open Emergency Mode panel and start turn-off flow
    await expect(page.getByTestId("emergency-mode-status-label")).toHaveText("ON", { timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-emergency-edit-button").click();

    await expect(page.getByTestId("settings-emergency-mode-panel")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByTestId("settings-deactivate-emergency-mode-button")).toBeVisible({
      timeout: TEST_TIMEOUTS.SHORT,
    });
    await page.getByTestId("settings-deactivate-emergency-mode-button").click();

    // Step 5: Sign the two transactions (Queue + Sign)
    await expect(page).toHaveURL(/\/create\/action\/turn-off-emergency/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("1/2")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("2/2")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1000);

    // Step 6: Execute queued turn-off-emergency transaction
    await page.getByTestId("view-queue-button").click();
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();
    await page.waitForTimeout(1000);

    // Step 7: Verify emergency mode is disabled
    await expect(page.getByText("Emergency Mode Activated")).not.toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    await page.getByTestId("header-safe-dropdown-button").click();
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-menu-item").click();

    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("emergency-mode-status-label")).toHaveText("OFF", { timeout: TEST_TIMEOUTS.LONG });
  });

  test("should detach Canon Guard via Settings page", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;
    const { guardAddress } = deployment.canonGuard;

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for the main app to load (guard is attached from previous tests)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Verify guard is attached (no detached mode banner)
    await expect(page.getByTestId("detached-mode-banner")).not.toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 3: Navigate to Settings via the Safe dropdown
    await page.getByTestId("header-safe-dropdown-button").click();
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-menu-item").click();

    // Wait for Settings page to load
    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify the Canon Guard shows as "Attached" before detaching
    await expect(page.getByTestId("canon-guard-status-label")).toHaveText("Attached", {
      timeout: TEST_TIMEOUTS.SHORT,
    });

    // Step 4: Click "DETACH" button in the Canon Guard section
    await page.getByTestId("settings-detach-button").click();

    // Step 5: Wait for the detach flow page to load
    await page.waitForTimeout(1000);

    // Step 6: Sign the first transaction (Deploy Detach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the first transaction to complete
    await expect(page.getByText("1/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Step 7: Sign the second transaction (Queue Detach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    await expect(page.getByText("2/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Step 8: Sign the third transaction (Sign Detach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    await expect(page.getByText("3/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1000);

    // Step 9: Click "View Queue" to go back to the queue
    await page.getByTestId("view-queue-button").click();

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 10: Execute the detach transaction
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();

    // After detaching, the Safe no longer has a guard on-chain.
    // The app reloads and shows the "no guard" choice screen.
    // Re-enter the guard address to continue in detached mode.
    await expect(page.getByTestId("no-guard-message")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("use-existing-guard-button").click();

    await expect(page.getByTestId("guard-address-label")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("guard-address-input").fill(guardAddress);

    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Step 11: Verify the detached mode banner appears (confirms guard is detached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 12: Navigate to Settings and verify guard shows as "Detached"
    await page.getByTestId("header-safe-dropdown-button").click();
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await page.getByTestId("settings-menu-item").click();

    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify the Canon Guard shows as "Detached"
    await expect(page.getByTestId("canon-guard-status-label")).toHaveText("Detached", {
      timeout: TEST_TIMEOUTS.SHORT,
    });

    // Verify the button now says "ATTACH" (inverse of what it was before)
    await expect(page.getByTestId("settings-attach-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
  });

  test("should display detached mode banner with working Learn More panel", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[2];
    const { safeAddress } = deployment.safe;

    // Step 1: Navigate to the app (guard was detached in previous test)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await switchToDeployment(deployment);

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await selectChain(page, chainSelector, CHAIN_CONFIG.OP_MAINNET.label);

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Step 3: Wait for the choice screen (Safe has no guard on-chain after detach)
    // Enter the guard address to continue in detached mode
    await expect(page.getByTestId("no-guard-message")).toBeVisible({
      timeout: TEST_TIMEOUTS.LONG,
    });
    await page.getByTestId("use-existing-guard-button").click();

    await expect(page.getByTestId("guard-address-label")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("guard-address-input").fill(deployment.canonGuard.guardAddress);

    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Step 4: Verify the detached mode banner is visible
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 5: Click "Learn more" link in the detached mode banner
    await page.getByTestId("learn-more-link").click();

    // Step 6: Verify the Deployment Modes Panel opens with correct content
    await expect(page.getByTestId("deployment-modes-panel")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("Attached vs. Detached")).toBeVisible();
    await expect(page.getByText("You can adopt Canon Guard in two modes.")).toBeVisible();

    // Step 7: Verify the "Attach Canon Guard" button is present (only shown in detached mode)
    await expect(page.getByTestId("attach-guard-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 8: Close the panel
    await page.getByTestId("close-panel-button").click();
    await expect(page.getByTestId("deployment-modes-panel")).not.toBeInViewport({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 9: Verify the banner is still visible after closing the panel
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
  });
});
