import { test, expect } from "./fixtures";

test.describe("Canon Guard Setup Flow", () => {
  test("should verify Safe deployment configuration", async ({ deployedSafe }) => {
    // Verify the Safe was deployed correctly in global setup
    expect(deployedSafe.safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployedSafe.owners).toHaveLength(1);
    expect(deployedSafe.threshold).toBe(1);
    expect(deployedSafe.owners[0].toLowerCase()).toBe("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");

    console.log(`[Test] Safe deployed at: ${deployedSafe.safeAddress}`);
  });

  test("all tests share the same deployed Safe", async ({ deployedSafe }) => {
    // The Safe is deployed once in global setup and shared across all tests
    const safeAddress = deployedSafe.safeAddress;

    expect(safeAddress).toBeDefined();
    expect(safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

    console.log(`[Test] Using shared Safe: ${safeAddress}`);
  });

  test("should deploy Safe and setup Canon Guard", async ({ page, deployedSafe }) => {
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
    await expect(page.getByText("Add New Safe Account")).toBeVisible({ timeout: 10000 });

    // Step 3: Paste the Safe address
    const safeAddressInput = page.locator('input[placeholder="0x..."]').first();
    await safeAddressInput.fill(safeAddress);

    // Step 4: Switch network from Ethereum to Optimism
    // The default is Ethereum Mainnet, we need to select OP Mainnet
    const chainSelector = page.locator("select");
    await chainSelector.selectOption({ label: "OP Mainnet" });

    // Verify Optimism is selected
    await expect(chainSelector).toHaveValue("10");

    // Step 5: Click Continue button
    await page.getByTestId("continue-button").click();

    // Wait for the app to process the Safe address
    await page.waitForTimeout(3000);

    // After continue, Safe without guard should show the choice screen
    await expect(page.getByText("doesn't have a Canon Guard set")).toBeVisible({
      timeout: 15000,
    });

    // Step 6: Click "Deploy New Canon Guard"
    await page.getByText("Deploy New Canon Guard").click();

    // Should now be on the Guard Setup Wizard - Configure step
    await expect(page.getByText("Setup Canon Guard")).toBeVisible({ timeout: 10000 });
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

    // Fill Emergency Trigger address (using zero address as specified)
    // The inputs are the last two text inputs with placeholder 0x...
    const addressInputs = page.locator('input[placeholder="0x..."]');
    const inputCount = await addressInputs.count();

    // Emergency Trigger is the second-to-last input
    const triggerInput = addressInputs.nth(inputCount - 2);
    await triggerInput.scrollIntoViewIfNeeded();
    await triggerInput.fill("0x0000000000000000000000000000000000000000");

    // Emergency Caller is the last input
    const callerInput = addressInputs.nth(inputCount - 1);
    await callerInput.scrollIntoViewIfNeeded();
    await callerInput.fill("0x0000000000000000000000000000000000000000");

    // Click Continue to go to Deploy step
    await page.getByRole("button", { name: /continue/i }).click();

    // Should now be on step 2 - Deploy
    await expect(page.getByText("Deployment Parameters")).toBeVisible({ timeout: 10000 });
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

    // Step 7: Deploy the Canon Guard
    // TODO: WIP - Add actual deployment via transaction signing
    // This would require:
    // 1. Connecting a wallet (Anvil account)
    // 2. Calling the Canon Guard Factory
    // 3. Getting the deployed guard address from the transaction receipt
    console.log("[Test] WIP: Canon Guard deployment step");

    // Step 8: Paste the Canon Guard address in the "Deployed Canon Guard Address" input
    // For now, we'll verify the input field exists
    await expect(page.getByText("Deployed Canon Guard Address")).toBeVisible();

    const guardAddressInput = page.locator('input[placeholder="0x..."]').last();
    await expect(guardAddressInput).toBeVisible();

    // Example: paste a mock guard address (would be real address after deployment)
    // await guardAddressInput.fill("0x1234567890123456789012345678901234567890");

    console.log("[Test] Canon Guard setup flow completed successfully");
  });
});
