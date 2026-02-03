import { ANVIL_ACCOUNTS, CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";

test.describe("Canon Guard Setup Flow", () => {
  test("should verify Safe deployment configuration", async ({ deployedSafe, ownerIndex }) => {
    // Verify the Safe was deployed correctly in global setup
    expect(deployedSafe.safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployedSafe.owners).toHaveLength(1);
    expect(deployedSafe.threshold).toBe(1);
    // The owner should be the Anvil account for this deployment's owner index
    expect(deployedSafe.owners[0].toLowerCase()).toBe(ANVIL_ACCOUNTS[ownerIndex].address.toLowerCase());
  });

  test("all tests share the same deployed Safe", async ({ deployedSafe }) => {
    // The Safe is deployed once in global setup and shared across all tests
    const safeAddress = deployedSafe.safeAddress;

    expect(safeAddress).toBeDefined();
    expect(safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test("should deploy Safe and setup Canon Guard", async ({
    page,
    deployedSafe,
    ownerIndex,
    setSigningAccountForDeployment,
  }) => {
    // Step 1: Safe is already deployed via global setup
    const { safeAddress } = deployedSafe;

    // Verify Safe was deployed correctly
    expect(safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployedSafe.owners).toHaveLength(1);
    expect(deployedSafe.threshold).toBe(1);

    // Step 2: Open the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch signing account to match this deployment's owner
    await setSigningAccountForDeployment();

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

    // Emergency Trigger is the second-to-last input - use the owner address for this deployment
    const triggerInput = addressInputs.nth(inputCount - 2);
    await triggerInput.scrollIntoViewIfNeeded();
    await triggerInput.fill(ANVIL_ACCOUNTS[ownerIndex].address);

    // Emergency Caller is the last input - use the owner address for this deployment
    const callerInput = addressInputs.nth(inputCount - 1);
    await callerInput.scrollIntoViewIfNeeded();
    await callerInput.fill(ANVIL_ACCOUNTS[ownerIndex].address);

    // Click Continue to go to Deploy step
    await page.getByRole("button", { name: /continue/i }).click();

    // Should now be on step 2 - Deploy (in-app deployment)
    await expect(page.getByText("Configuration Summary")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Verify the configuration summary is displayed correctly
    await expect(page.getByText("Short Execution Delay")).toBeVisible();
    await expect(page.getByText("Long Execution Delay")).toBeVisible();
    await expect(page.getByText("Transaction Expiry")).toBeVisible();
    await expect(page.getByText("Max Approval Duration")).toBeVisible();
    await expect(page.getByText("Emergency Trigger")).toBeVisible();
    await expect(page.getByText("Emergency Caller")).toBeVisible();

    // Step 7: Click Deploy Canon Guard button
    const deployButton = page.getByTestId("deploy-guard-button");
    await expect(deployButton).toBeVisible();
    await deployButton.click();

    // Step 8: Wait for deployment to complete
    await expect(page.getByTestId("deploy-success-message")).toBeVisible({
      timeout: TEST_TIMEOUTS.TRANSACTION,
    });

    // Step 9: Verify setup completes successfully
    // After deployment, the wizard auto-redirects to the main Canon Guard App
    // The main app shows the Queue section with search bar and filters

    // Verify the Queue section is visible (main app loaded)
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

    // Verify the Queue title is visible
    await expect(page.getByTestId("queue-title")).toBeVisible();

    // Verify the filter tabs are visible
    await expect(page.getByTestId("filter-all")).toBeVisible();
    await expect(page.getByTestId("filter-in-review")).toBeVisible();
    await expect(page.getByTestId("filter-signed")).toBeVisible();

    // Verify the URL has been updated with a guard address
    const url = new URL(page.url());
    expect(url.searchParams.get("guardAddress")).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(url.searchParams.get("safeAddress")).toBe(safeAddress);
    expect(url.searchParams.get("chainId")).toBe(CHAIN_CONFIG.OP_MAINNET.id.toString());
  });
});
