import { ANVIL_ACCOUNT_ADDRESS, CHAIN_CONFIG, TEST_TIMEOUTS, VITALIK_ADDRESS } from "./constants";
import { test, expect } from "./fixtures";

// Use deployment index 0 - this allows other test files to use different indices for parallel execution
test.use({ deploymentIndex: 0 });

// Use serial execution to ensure tests run in order (attach must run before arbitrary action)
test.describe.serial("Canon Guard E2E Flow", () => {
  test("should attach an existing Canon Guard to a Safe through the UI", async ({
    page,
    deployedSafe,
    deployedCanonGuard,
  }) => {
    const { safeAddress } = deployedSafe;
    const { guardAddress } = deployedCanonGuard;

    console.log(`[Test] Using Safe: ${safeAddress}`);
    console.log(`[Test] Using Canon Guard: ${guardAddress}`);

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

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
    await page.waitForTimeout(2000);

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

    console.log("[Test] App loaded in detached mode");

    // Step 9: Click "Learn more" link in the detached mode banner
    await page.getByTestId("learn-more-link").click();

    // Step 10: Verify the Deployment Modes Panel opens and click "Attach Canon Guard"
    await expect(page.getByTestId("deployment-modes-panel")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("Attached vs. Detached")).toBeVisible();

    // Click the "Attach Canon Guard" button in the modal
    await page.getByTestId("attach-guard-button").click();

    console.log("[Test] Navigating to attach guard flow");

    // Step 11: Wait for the modal to close and verify we're on the attach flow page
    await page.waitForTimeout(1000);

    // Step 12: Sign the first transaction (Deploy Attach Action)
    console.log("[Test] Signing transaction 1/3: Deploy Attach Action");

    // Wait for status to show 0/3 or the sign button to be ready
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the first transaction to complete - status should change to 1/3
    await expect(page.getByText("1/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 1/3 signed");

    // Step 13: Sign the second transaction (Queue Attach Action)
    console.log("[Test] Signing transaction 2/3: Queue Attach Action");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the second transaction to complete - status should change to 2/3
    await expect(page.getByText("2/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 2/3 signed");

    // Step 14: Sign the third transaction (Sign Attach Action)
    console.log("[Test] Signing transaction 3/3: Sign Attach Action");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the third transaction to complete - status should change to 3/3
    await expect(page.getByText("3/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 3/3 signed");
    console.log("[Test] All 3 transactions signed successfully");

    await page.waitForTimeout(3000);

    // Step 15: Click "View Queue" to go back to the queue
    await page.getByTestId("view-queue-button").click();
    console.log("[Test] Navigating to queue");

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 16: The transaction needs to be signed to reach threshold (shows "Signed 0/1")
    // Click "SIGN" button on the queue item
    console.log("[Test] Looking for execute button on queue item");
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();

    // Wait for the signing to complete
    await page.waitForTimeout(1000);

    console.log("[Test] Attach Canon Guard flow completed - guard should now be attached");
  });

  test("should create an arbitrary action and execute it from the queue", async ({ page, deployedSafe }) => {
    const { safeAddress } = deployedSafe;

    console.log(`[Test] Using Safe: ${safeAddress}`);

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(2000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    console.log("[Test] App loaded successfully");

    // Step 3: Click 'CREATE' in the header
    await page.getByTestId("create-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Create page
    await expect(page.getByTestId("create-page-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] Navigated to Create page");

    // Step 4: Click 'New Action'
    await page.getByTestId("new-action-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Select Factory page
    await expect(page.getByTestId("select-factory-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Select Factory page");

    // Step 5: Click 'Arbitrary Action'
    await page.getByTestId("arbitrary-action-option").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Arbitrary Action form
    await expect(page.getByTestId("transaction-title-label")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Arbitrary Action form");

    // Step 6: Type 'test1' in the transaction title
    await page.getByTestId("transaction-title-input").fill("test1");

    // Step 7: Fill in target address, calldata, and value
    await page.getByTestId("target-address-input").fill(VITALIK_ADDRESS);
    await page.getByTestId("calldata-input").fill("0xffffffffff");
    await page.getByTestId("value-input").fill("0");

    console.log("[Test] Filled form with test data");

    // Step 8: Click Continue
    await page.getByTestId("form-continue-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Review page
    await expect(page.getByTestId("preview-action-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("test1")).toBeVisible();
    console.log("[Test] On Review page");

    // Step 9: Click Initiate
    await page.getByTestId("initiate-button").click();
    await page.waitForTimeout(1000);

    console.log("[Test] Starting signing flow");

    // Step 10: Sign the four transactions
    // Transaction 1/4: Deploy Arbitrary Action
    console.log("[Test] Signing transaction 1/4: Deploy Arbitrary Action");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("1/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 1/4 signed");

    // Transaction 2/4: Save to Canon List
    console.log("[Test] Signing transaction 2/4: Save to Canon List");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("2/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 2/4 signed");

    // Transaction 3/4: Queue Transaction
    console.log("[Test] Signing transaction 3/4: Queue Transaction");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("3/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 3/4 signed");

    // Transaction 4/4: Sign Transaction
    console.log("[Test] Signing transaction 4/4: Sign Transaction");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText("4/4")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 4/4 signed");

    console.log("[Test] All 4 transactions signed successfully");
    await page.waitForTimeout(2000);

    // Step 11: Click 'View Queue'
    await page.getByTestId("view-queue-button").click();
    console.log("[Test] Navigating to queue");

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("queue-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Queue page");

    // Step 12: Look for the item in "Ready to Execute" section and click Execute
    // The item should be in "Ready to Execute" since it's a 1/1 Safe and we just signed it
    await expect(page.getByTestId("ready-to-execute-section")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    console.log("[Test] Found 'Ready to Execute' section");

    // Find and click the Execute button
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("execute-button").click();
    console.log("[Test] Clicked Execute button");

    // Wait for execution to complete
    await page.waitForTimeout(3000);

    console.log("[Test] Arbitrary action created and executed successfully");
  });

  test("should create a hub action with pre-approval and execute it", async ({ page, deployedSafe }) => {
    const { safeAddress } = deployedSafe;

    console.log(`[Test] Using Safe: ${safeAddress}`);

    // USDC address on Optimism
    const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

    // Step 1: Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 2: Enter the Safe address and select OP Mainnet
    await page.getByTestId("safe-address-input").fill(safeAddress);

    const chainSelector = page.getByTestId("chain-selector");
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(2000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    console.log("[Test] App loaded successfully");

    // Step 3: Click 'CREATE' in the header
    await page.getByTestId("create-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Create page
    await expect(page.getByTestId("create-page-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] Navigated to Create page");

    // Step 4: Click 'New Action from Hub'
    await page.getByTestId("new-action-hub-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Select Hub Type page
    await expect(page.getByTestId("select-hub-type-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Select Hub Type page");

    // Step 5: Click 'Hub: Cap Transfer' option
    await page.getByTestId("capped-transfer-hub-option").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Capped Transfer Hub form
    await expect(page.getByTestId("hub-title-card")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Capped Transfer Hub form");

    // Step 6: Fill in the form fields
    // Title
    await page.getByTestId("hub-title-input").fill("salary");

    // Recipient address - use the connected address (Anvil account 0)
    await page.getByTestId("hub-recipient-input").fill(ANVIL_ACCOUNT_ADDRESS);

    // Epoch length - select "1 month" by setting the input to 1 and selecting "Months"
    await page.getByTestId("hub-epoch-length-input").fill("1");
    await page.getByTestId("hub-epoch-unit-select").selectOption({ label: "Months" });

    // Token address (USDC on Optimism)
    await page.getByTestId("hub-token-address-input").fill(USDC_OPTIMISM);

    // Token amount
    await page.getByTestId("hub-token-amount-input").fill("100");

    console.log("[Test] Filled hub form with test data");

    // Step 7: Click Continue
    await page.getByTestId("hub-form-continue-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Hub Review page
    await expect(page.getByTestId("hub-preview-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Hub Review page");

    // Step 8: Select pre-approval and click Initiate
    await page.getByTestId("hub-pre-approval-checkbox").click();
    await page.waitForTimeout(500);

    await page.getByTestId("hub-initiate-button").click();
    await page.waitForTimeout(1000);

    console.log("[Test] Starting signing flow");

    // Step 9: Sign all the transactions
    // The hub flow with pre-approval has multiple transactions
    // Transaction 1: Deploy Hub
    console.log("[Test] Signing transaction 1: Deploy Hub");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/1\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 1 signed");

    // Transaction 2: Save to Canon List
    console.log("[Test] Signing transaction 2: Save to Canon List");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/2\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 2 signed");

    // Transaction 3: Deploy Pre-Approval
    console.log("[Test] Signing transaction 3: Deploy Pre-Approval");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/3\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 3 signed");

    // Transaction 4: Queue Pre-Approval
    console.log("[Test] Signing transaction 4: Queue Pre-Approval");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/4\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 4 signed");

    // Transaction 5: Sign Pre-Approval
    console.log("[Test] Signing transaction 5: Sign Pre-Approval");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/5\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 5 signed");

    console.log("[Test] All transactions signed successfully");
    await page.waitForTimeout(2000);

    // Step 10: Click 'View Queue'
    await page.getByTestId("view-queue-button").click();
    console.log("[Test] Navigating to queue");

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByTestId("queue-title")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    console.log("[Test] On Queue page");

    // Step 11: Click Execute
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("execute-button").click();
    console.log("[Test] Clicked Execute button");

    // Wait for execution to complete
    await page.waitForTimeout(3000);

    // Step 12: Click 'Canon List' in the header to navigate to the list of actions
    await page.getByTestId("canon-list-button").click();
    console.log("[Test] Navigating to Canon List");

    // Wait for Canon List page to load
    await expect(page.getByText("Canon list")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.waitForTimeout(2000);

    // Step 13: Verify the saved transaction has the deployed hub with the "fast-path" tag
    // The hub should be saved with a "fast-path" indicator since we enabled pre-approval
    await expect(page.getByTestId("fast-path-indicator")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    console.log("[Test] Found fast-path indicator on Canon List");

    console.log("[Test] Hub action created and executed successfully with fast-path enabled");
  });
});
