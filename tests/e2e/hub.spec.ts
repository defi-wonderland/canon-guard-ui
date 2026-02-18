import { ANVIL_ACCOUNTS, CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";
import { fundSafe } from "./utils/fundSafe";
import { selectChain } from "./utils/selectChain";
import { selectOption } from "./utils/selectOption";

// Use serial execution to ensure tests run in order (attach must run before arbitrary action)
test.describe.serial("Hub E2E Flow", () => {
  test("should create a hub action with pre-approval and execute it", async ({
    page,
    deployments,
    switchToDeployment,
  }) => {
    const deployment = deployments[3];
    const { safeAddress } = deployment.safe;
    const { guardAddress } = deployment.canonGuard;

    // USDC address on Optimism
    const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

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

    // Step 7: Wait for validation (green checkmark appears) and click Continue
    // Wait for the validation to complete - check that Continue button becomes enabled
    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Fund the Safe with USDC before creating hub
    await fundSafe({
      safeAddress,
      amount: "1000",
    });

    // Step 4: Click 'CREATE' in the header
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
    await selectOption(page, page.getByTestId("hub-epoch-unit-select"), "Months");

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

  test("should deploy a hub child and execute it", async ({ page, deployments, switchToDeployment }) => {
    const deployment = deployments[3];
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

    // Step 7: Wait for validation (green checkmark appears) and click Continue
    // Wait for the validation to complete - check that Continue button becomes enabled
    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Step 3: Navigate to Canon List
    await page.getByTestId("canon-list-button").click();

    // Wait for Canon List page to load
    await expect(page.getByText("Canon list")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.waitForTimeout(1000);

    // Step 4: Find the "salary" hub action and click the 3-dot menu
    // The hub from the previous test should be visible with title "salary"
    await expect(page.getByTestId("canon-list-item-salary")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Click the menu button (3 dots)
    await page.getByTestId("canon-list-item-salary").getByTestId("action-menu-button").click();

    // Wait for menu to open
    await expect(page.getByTestId("deploy-child-menu-item")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 5: Click "Deploy Child"
    await page.getByTestId("deploy-child-menu-item").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Deploy Child form
    await expect(page.getByTestId("hub-child-form-continue-button")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

    // Step 6: Fill in the form
    await page.getByTestId("hub-child-title-input").fill("salary 1");

    // Select token from dropdown
    await page.getByTestId("hub-child-token-select").click();
    await page.waitForTimeout(1000);

    // Click the first token option (USDC) - use text locator since symbol may vary
    await page.locator("[data-testid^='hub-child-token-option-']").first().click();
    await page.waitForTimeout(1000);

    // Fill amount
    await page.getByTestId("hub-child-amount-input").fill("10");
    await page.waitForTimeout(500);

    // Step 7: Click Continue - wait for button to be enabled
    await expect(page.getByTestId("hub-child-form-continue-button")).toBeEnabled({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("hub-child-form-continue-button").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Review page
    await expect(page.getByTestId("hub-child-review-section")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
    await expect(page.getByText("salary 1")).toBeVisible();

    // Step 8: Click Initiate
    await page.getByTestId("initiate-button").click();
    await page.waitForTimeout(1000);

    // Step 9: Sign all the transactions
    // Transaction 1: Deploy Child
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/1\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 2: Queue Transaction
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/2\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 3: Sign Transaction
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/3\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

    // Transaction 4: Sign Transaction
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();
    await expect(page.getByText(/4\/\d+/)).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });

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
  });
});
