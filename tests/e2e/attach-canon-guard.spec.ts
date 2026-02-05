import { ANVIL_ACCOUNTS, CHAIN_CONFIG, TEST_TIMEOUTS, VITALIK_ADDRESS } from "./constants";
import { test, expect } from "./fixtures";

// Use serial execution to ensure tests run in order (attach must run before arbitrary action)
test.describe.serial("Canon Guard E2E Flow", () => {
  test("should attach an existing Canon Guard to a Safe through the UI", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[0];
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
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

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

    // Step 7: Wait for validation (green checkmark appears) and click Continue
    // Wait for the validation to complete - check that Continue button becomes enabled
    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Step 8: Verify app loads in detached mode with the warning banner
    // The main app should show the Queue section and the detached mode banner
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 9: Click "Learn more" link in the detached mode banner
    await page.getByTestId("learn-more-link").click();

    // Step 10: Verify the Deployment Modes Panel opens and click "Attach Canon Guard"
    await expect(page.getByTestId("deployment-modes-panel")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("Attached vs. Detached")).toBeVisible();

    // Click the "Attach Canon Guard" button in the modal
    await page.getByTestId("attach-guard-button").click();

    // Step 11: Wait for the modal to close and verify we're on the attach flow page
    await page.waitForTimeout(1000);

    // Step 12: Sign the first transaction (Deploy Attach Action)

    // Wait for status to show 0/3 or the sign button to be ready
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the first transaction to complete - status should change to 1/3
    await expect(page.getByText("1/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Step 13: Sign the second transaction (Queue Attach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the second transaction to complete - status should change to 2/3
    await expect(page.getByText("2/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Step 14: Sign the third transaction (Sign Attach Action)
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the third transaction to complete - status should change to 3/3
    await expect(page.getByText("3/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1500);

    // Step 15: Click "View Queue" to go back to the queue
    await page.getByTestId("view-queue-button").click();

    // Step 15: Verify we're on the home page with queue list visible
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify CREATE button is visible in the header (indicating we're on the main app)
    await expect(page.getByTestId("create-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 16: The transaction needs to be signed to reach threshold (shows "Signed 0/1")
    // Click "Execute" button on the queue item
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();

    // Wait for execution to complete
    await page.waitForTimeout(1500);

    // Step 17: Verify we're still on the home page after execution
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("create-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 18: Navigate to Settings via the Safe dropdown and verify guard is attached
    // Click on the Safe dropdown button in the header
    await page.getByTestId("header-safe-dropdown-button").click();

    // Wait for the dropdown menu to be visible
    await expect(page.getByTestId("safe-dropdown-menu")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Click Settings in the dropdown
    await page.getByTestId("settings-menu-item").click();

    // Wait for navigation to complete
    await page.waitForURL(/\/settings/, { timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify we're on the Settings page
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify the Canon Guard shows as "Attached" (not "Detached")
    await expect(page.getByTestId("canon-guard-status-label")).toHaveText("Attached", {
      timeout: TEST_TIMEOUTS.SHORT,
    });
  });

  test("should create an arbitrary action and execute it from the queue", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[0];
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
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Click 'CREATE' in the header
    await page.getByTestId("create-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Create page
    await expect(page.getByTestId("create-page-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 4: Click 'New Action'
    await page.getByTestId("new-action-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Select Factory page
    await expect(page.getByTestId("select-factory-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 5: Click 'Arbitrary Action'
    await page.getByTestId("arbitrary-action-option").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Arbitrary Action form
    await expect(page.getByTestId("transaction-title-label")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 6: Type 'test1' in the transaction title
    await page.getByTestId("transaction-title-input").fill("test1");

    // Step 7: Fill in target address, calldata, and value
    await page.getByTestId("target-address-input").fill(VITALIK_ADDRESS);
    await page.getByTestId("calldata-input").fill("0xffffffffff");
    await page.getByTestId("value-input").fill("0");

    // Step 8: Click Continue
    await page.getByTestId("form-continue-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Review page
    await expect(page.getByTestId("preview-action-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("test1")).toBeVisible();

    // Step 9: Click Initiate
    await page.getByTestId("initiate-button").click();
    await page.waitForTimeout(1000);

    // Step 10: Sign the four transactions
    // Transaction 1/4: Deploy Arbitrary Action
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
    // The item should be in "Ready to Execute" since it's a 1/1 Safe and we just signed it
    await expect(page.getByTestId("ready-to-execute-section")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Find and click the Execute button
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("execute-button").click();

    // Wait for execution to complete
    await page.waitForTimeout(1000);
  });

  test("should create a hub action with pre-approval and execute it", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[0];
    const { safeAddress } = deployment.safe;

    // USDC address on Optimism
    const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

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
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(1000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Click 'CREATE' in the header
    await page.getByTestId("create-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Create page
    await expect(page.getByTestId("create-page-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 4: Click 'New Action from Hub'
    await page.getByTestId("new-action-hub-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Select Hub Type page
    await expect(page.getByTestId("select-hub-type-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 5: Click 'Hub: Cap Transfer' option
    await page.getByTestId("capped-transfer-hub-option").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Capped Transfer Hub form
    await expect(page.getByTestId("hub-title-card")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 6: Fill in the form fields
    // Title
    await page.getByTestId("hub-title-input").fill("salary");

    // Recipient address - use the connected address (Anvil account for this deployment)
    await page.getByTestId("hub-recipient-input").fill(ANVIL_ACCOUNTS[deployment.index].address);

    // Epoch length - select "1 month" by setting the input to 1 and selecting "Months"
    await page.getByTestId("hub-epoch-length-input").fill("1");
    await page.getByTestId("hub-epoch-unit-select").selectOption({ label: "Months" });

    // Token address (USDC on Optimism)
    await page.getByTestId("hub-token-address-input").fill(USDC_OPTIMISM);

    // Token amount
    await page.getByTestId("hub-token-amount-input").fill("100");

    // Step 7: Click Continue
    await page.getByTestId("hub-form-continue-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Hub Review page
    await expect(page.getByTestId("hub-preview-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 8: Select pre-approval and click Initiate
    await page.getByTestId("hub-pre-approval-checkbox").click();
    await page.waitForTimeout(500);

    await page.getByTestId("hub-initiate-button").click();
    await page.waitForTimeout(1000);

    // Step 9: Sign all the transactions
    // The hub flow with pre-approval has multiple transactions
    // Transaction 1: Deploy Hub
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/1\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 2: Save to Canon List
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/2\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 3: Deploy Pre-Approval
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/3\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 4: Queue Pre-Approval
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/4\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 5: Sign Pre-Approval
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/5\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    await page.waitForTimeout(1000);

    // Step 10: Click 'View Queue'
    await page.getByTestId("view-queue-button").click();

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("queue-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 11: Click Execute
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("execute-button").click();

    // Wait for execution to complete
    await page.waitForTimeout(1000);

    // Step 12: Click 'Canon List' in the header to navigate to the list of actions
    await page.getByTestId("canon-list-button").click();

    // Wait for Canon List page to load
    await expect(page.getByText("Canon list")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.waitForTimeout(1000);

    // Step 13: Verify the saved transaction has the deployed hub with the "fast-path" tag
    // The hub should be saved with a "fast-path" indicator since we enabled pre-approval
    await expect(page.getByTestId("fast-path-indicator")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
  });
});
