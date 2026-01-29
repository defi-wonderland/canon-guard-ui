import { ANVIL_ACCOUNT_ADDRESS, CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";

test.describe("Canon Guard Setup Flow", () => {
  test("should verify Safe deployment configuration", async ({ deployedSafe }) => {
    // Verify the Safe was deployed correctly in global setup
    expect(deployedSafe.safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployedSafe.owners).toHaveLength(1);
    expect(deployedSafe.threshold).toBe(1);
    expect(deployedSafe.owners[0].toLowerCase()).toBe(ANVIL_ACCOUNT_ADDRESS.toLowerCase());

    console.log(`[Test] Safe deployed at: ${deployedSafe.safeAddress}`);
  });

  test("all tests share the same deployed Safe", async ({ deployedSafe }) => {
    // The Safe is deployed once in global setup and shared across all tests
    const safeAddress = deployedSafe.safeAddress;

    expect(safeAddress).toBeDefined();
    expect(safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

    console.log(`[Test] Using shared Safe: ${safeAddress}`);
  });

  test("should deploy Safe and setup Canon Guard", async ({ page, deployedSafe, deployedCanonGuard }) => {
    // Step 1: Safe is already deployed via global setup
    const { safeAddress } = deployedSafe;
    console.log(`[Test] Using deployed Safe: ${safeAddress}`);

    // Verify Safe was deployed correctly
    expect(safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployedSafe.owners).toHaveLength(1);
    expect(deployedSafe.threshold).toBe(1);

    // Step 2: Open the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify setup form is visible
    await expect(page.getByTestId("setup-form")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 3: Paste the Safe address
    await page.getByTestId("safe-address-input").fill(safeAddress);

    // Step 4: Switch network from Ethereum to Optimism
    // The default is Ethereum Mainnet, we need to select OP Mainnet
    const chainSelector = page.getByTestId("chain-selector");
    await chainSelector.selectOption({ label: CHAIN_CONFIG.OP_MAINNET.label });

    // Verify Optimism is selected
    await expect(chainSelector).toHaveValue(CHAIN_CONFIG.OP_MAINNET.id.toString());

    // Step 5: Click Continue button
    await page.getByTestId("continue-button").click();

    // Wait for the app to process the Safe address
    await page.waitForTimeout(3000);

    // After continue, Safe without guard should show the choice screen
    await expect(page.getByTestId("no-guard-message")).toBeVisible({
      timeout: TEST_TIMEOUTS.LONG,
    });

    // Step 6: Click "Deploy New Canon Guard"
    await page.getByTestId("deploy-new-guard-button").click();

    // Should now be on the Guard Setup Wizard - Configure step
    await expect(page.getByText("Setup Canon Guard")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    // Step indicator shows "Configure" label
    await expect(page.getByText("Configure", { exact: true })).toBeVisible();

    // Fill in the Canon Guard parameters:
    // The defaults are already set correctly for the time-based fields:
    // - Short Execution Delay: 1 hour = 3600s ✓
    // - Long Execution Delay: 7 days = 604800s ✓
    // - Transaction Expiry: 7 days = 604800s ✓
    // - Max Approval Duration: 4 months ≈ 10368000s ✓

    // Scroll down to see Emergency fields
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Fill Emergency Trigger address (using Anvil account 0 - must be non-zero)
    // The inputs are the last two text inputs with placeholder 0x...
    const addressInputs = page.locator('input[placeholder="0x..."]');
    const inputCount = await addressInputs.count();

    // Emergency Trigger is the second-to-last input
    const triggerInput = addressInputs.nth(inputCount - 2);
    await triggerInput.scrollIntoViewIfNeeded();
    await triggerInput.fill(ANVIL_ACCOUNT_ADDRESS);

    // Emergency Caller is the last input
    const callerInput = addressInputs.nth(inputCount - 1);
    await callerInput.scrollIntoViewIfNeeded();
    await callerInput.fill(ANVIL_ACCOUNT_ADDRESS);

    // Click Continue to go to Deploy step
    await page.getByRole("button", { name: /continue/i }).click();

    // Should now be on step 2 - Deploy
    await expect(page.getByText("Deployment Parameters")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await expect(page.getByText("Function Arguments")).toBeVisible();

    // Verify the parameters are displayed correctly
    await expect(page.getByText("_safe")).toBeVisible();
    await expect(page.getByText("_multiSendCallOnly")).toBeVisible();
    await expect(page.getByText("_shortTxExecutionDelay")).toBeVisible();
    await expect(page.getByText("_longTxExecutionDelay")).toBeVisible();
    await expect(page.getByText("_txExpiryDelay")).toBeVisible();
    await expect(page.getByText("_maxApprovalDuration")).toBeVisible();
    await expect(page.getByText("_emergencyTrigger")).toBeVisible();
    await expect(page.getByText("_emergencyCaller")).toBeVisible();

    // Step 7: Deploy the Canon Guard programmatically
    // The UI instructs users to deploy via Safe Transaction Builder,
    // but for e2e testing we deploy directly using viem
    console.log("[Test] Deploying Canon Guard...");

    console.log(`[Test] Canon Guard deployed at: ${deployedCanonGuard.guardAddress}`);
    console.log(`[Test] Transaction hash: ${deployedCanonGuard.transactionHash}`);

    // Step 8: Paste the Canon Guard address in the "Deployed Canon Guard Address" input
    await expect(page.getByText("Deployed Canon Guard Address")).toBeVisible();

    const guardAddressInput = page.locator('input[placeholder="0x..."]').last();
    await expect(guardAddressInput).toBeVisible();

    // Fill in the deployed guard address
    await guardAddressInput.fill(deployedCanonGuard.guardAddress);

    // Wait for validation to complete (the UI validates the guard address)
    // The validation checks PARENT() and isChild() on the factory
    await page.waitForTimeout(2000);

    // Step 9: Click Continue to complete the setup
    const continueButton = page.getByRole("button", { name: /continue/i });

    // Wait for the button to be enabled (validation must pass first)
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.MEDIUM });

    await continueButton.click();

    // Step 10: Verify setup completes successfully
    // After clicking continue, the wizard should complete and show the main Canon Guard App
    // The main app shows the Queue section with search bar and filters

    // Verify the Queue section is visible (main app loaded)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Verify the Queue title is visible
    await expect(page.getByTestId("queue-title")).toBeVisible();

    // Verify the filter tabs are visible
    await expect(page.getByTestId("filter-all")).toBeVisible();
    await expect(page.getByTestId("filter-in-review")).toBeVisible();
    await expect(page.getByTestId("filter-signed")).toBeVisible();

    // Verify the URL has been updated with the guard address
    const url = new URL(page.url());
    expect(url.searchParams.get("guardAddress")).toBe(deployedCanonGuard.guardAddress);
    expect(url.searchParams.get("safeAddress")).toBe(safeAddress);
    expect(url.searchParams.get("chainId")).toBe(CHAIN_CONFIG.OP_MAINNET.id.toString());

    console.log("[Test] Canon Guard setup flow completed successfully");
    console.log(`[Test] Final URL: ${page.url()}`);
  });
});
