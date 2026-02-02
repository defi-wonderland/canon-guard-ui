import { CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";

// Use deployment index 1 - allows this test file to run in parallel with attach-canon-guard.spec.ts
test.use({ deploymentIndex: 1 });

// Use serial execution to ensure tests run in order within this file
test.describe.serial("Settings Attach Flow", () => {
  test("should attach an existing Canon Guard via Settings page", async ({
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

    // Step 7: Wait for validation and click Continue
    const continueButton = page.getByTestId("guard-continue-button");
    await expect(continueButton).toBeEnabled({ timeout: TEST_TIMEOUTS.LONG });
    await continueButton.click();

    // Step 8: Verify app loads in detached mode with the warning banner
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await expect(page.getByTestId("detached-mode-banner")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    console.log("[Test] App loaded in detached mode");

    // Step 9: Click on the Safe dropdown in the header
    await page.getByTestId("safe-dropdown-button").click();
    await page.waitForTimeout(500);

    // Step 10: Click on "Settings" in the dropdown menu
    await page.getByTestId("settings-menu-item").click();
    console.log("[Test] Navigating to Settings page");

    // Step 11: Wait for Settings page to load
    await expect(page.getByText("General Settings")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.waitForTimeout(1000);

    // Step 12: Click "ATTACH" button in the Canon Guard section
    await page.getByTestId("settings-attach-button").click();
    console.log("[Test] Clicked Attach button in Settings");

    // Step 13: Wait for the attach flow page to load
    await page.waitForTimeout(1000);

    // Step 14: Sign the first transaction (Deploy Attach Action)
    console.log("[Test] Signing transaction 1/3: Deploy Attach Action");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    // Wait for the first transaction to complete
    await expect(page.getByText("1/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 1/3 signed");

    // Step 15: Sign the second transaction (Queue Attach Action)
    console.log("[Test] Signing transaction 2/3: Queue Attach Action");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    await expect(page.getByText("2/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 2/3 signed");

    // Step 16: Sign the third transaction (Sign Attach Action)
    console.log("[Test] Signing transaction 3/3: Sign Attach Action");
    await expect(page.getByTestId("sign-button")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    await page.getByTestId("sign-button").click();

    await expect(page.getByText("3/3")).toBeVisible({ timeout: TEST_TIMEOUTS.TRANSACTION });
    console.log("[Test] Transaction 3/3 signed");
    console.log("[Test] All 3 transactions signed successfully");

    await page.waitForTimeout(3000);

    // Step 17: Click "View Queue" to go back to the queue
    await page.getByTestId("view-queue-button").click();
    console.log("[Test] Navigating to queue");

    // Wait for the queue page to load
    await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

    // Step 18: The transaction needs to be executed
    console.log("[Test] Looking for execute button on queue item");
    await expect(page.getByTestId("execute-button")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });
    await page.getByTestId("execute-button").click();

    // Wait for the execution to complete
    await page.waitForTimeout(1000);

    console.log("[Test] Attach Canon Guard via Settings flow completed - guard should now be attached");
  });
});
