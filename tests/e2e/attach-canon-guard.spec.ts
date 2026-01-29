import { test, expect } from "./fixtures";

// Vitalik's address for test purposes
const VITALIK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

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
    await expect(page.getByText("Add New Safe Account")).toBeVisible({ timeout: 10000 });

    // Step 2: Enter the Safe address
    const safeAddressInput = page.locator('input[placeholder="0x..."]').first();
    await safeAddressInput.fill(safeAddress);

    // Step 3: Select OP Mainnet chain
    const chainSelector = page.locator("select");
    await chainSelector.selectOption({ label: "OP Mainnet" });
    await expect(chainSelector).toHaveValue("10");

    // Step 4: Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(2000);

    // Step 5: Wait for the choice screen to appear and click "Use Existing Canon Guard"
    await expect(page.getByText("doesn't have a Canon Guard set")).toBeVisible({
      timeout: 15000,
    });
    await page.getByText("Use Existing Canon Guard").click();

    // Step 6: Enter the Canon Guard address
    await expect(page.getByText("Canon Guard Address", { exact: true })).toBeVisible({ timeout: 10000 });
    const guardAddressInput = page.locator('input[placeholder="0x..."]');
    await guardAddressInput.fill(guardAddress);

    // Step 7: Wait for validation (green checkmark appears) and click Continue
    // Wait for the validation to complete - check that Continue button becomes enabled
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 15000 });
    await continueButton.click();

    // Step 8: Verify app loads in detached mode with the warning banner
    // The main app should show the Queue section and the detached mode banner
    await expect(page.getByPlaceholder("Search by name or 0x...")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Canon Guard is detached")).toBeVisible({ timeout: 10000 });

    console.log("[Test] App loaded in detached mode");

    // Step 9: Click "Learn more" link in the detached mode banner
    await page.getByText("Learn more").click();

    // Step 10: Verify the Deployment Modes Panel opens and click "Attach Canon Guard"
    await expect(page.getByText("Deployment modes:")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Attached vs. Detached")).toBeVisible();

    // Click the "Attach Canon Guard" button in the modal (first one, as there may be duplicates)
    await page
      .getByRole("button", { name: /attach canon guard/i })
      .first()
      .click();

    console.log("[Test] Navigating to attach guard flow");

    // Step 11: Wait for the modal to close and verify we're on the attach flow page
    await page.waitForTimeout(1000);

    // Step 12: Sign the first transaction (Deploy Attach Action)
    console.log("[Test] Signing transaction 1/3: Deploy Attach Action");

    // Wait for status to show 0/3 or the sign button to be ready
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();

    // Wait for the first transaction to complete - status should change to 1/3
    await expect(page.getByText("1/3")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 1/3 signed");

    // Step 13: Sign the second transaction (Queue Attach Action)
    console.log("[Test] Signing transaction 2/3: Queue Attach Action");
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();

    // Wait for the second transaction to complete - status should change to 2/3
    await expect(page.getByText("2/3")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 2/3 signed");

    // Step 14: Sign the third transaction (Sign Attach Action)
    console.log("[Test] Signing transaction 3/3: Sign Attach Action");
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();

    // Wait for the third transaction to complete - status should change to 3/3
    await expect(page.getByText("3/3")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 3/3 signed");
    console.log("[Test] All 3 transactions signed successfully");

    await page.waitForTimeout(3000);

    // Step 15: Click "View Queue" to go back to the queue
    await page.getByRole("button", { name: /view queue/i }).click();
    console.log("[Test] Navigating to queue");

    // Wait for the queue page to load
    await expect(page.getByPlaceholder("Search by name or 0x...")).toBeVisible({ timeout: 10000 });

    // Step 16: The transaction needs to be signed to reach threshold (shows "Signed 0/1")
    // Click "SIGN" button on the queue item
    console.log("[Test] Looking for execute button on queue item");
    await expect(page.getByRole("button", { name: /^execute$/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /^execute$/i }).click();

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
    await expect(page.getByText("Add New Safe Account")).toBeVisible({ timeout: 10000 });

    // Step 2: Enter the Safe address and select OP Mainnet
    const safeAddressInput = page.locator('input[placeholder="0x..."]').first();
    await safeAddressInput.fill(safeAddress);

    const chainSelector = page.locator("select");
    await chainSelector.selectOption({ label: "OP Mainnet" });
    await expect(chainSelector).toHaveValue("10");

    // Click Continue
    await page.getByTestId("continue-button").click();
    await page.waitForTimeout(2000);

    // Wait for the main app to load (Queue section should be visible since guard is attached)
    await expect(page.getByPlaceholder("Search by name or 0x...")).toBeVisible({ timeout: 15000 });
    console.log("[Test] App loaded successfully");

    // Step 3: Click 'CREATE' in the header
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForTimeout(1000);

    // Verify we're on the Create page
    await expect(page.getByText("Create transaction")).toBeVisible({ timeout: 5000 });
    console.log("[Test] Navigated to Create page");

    // Step 4: Click 'New Action'
    await page.getByText("New Action").first().click();
    await page.waitForTimeout(1000);

    // Verify we're on the Select Factory page
    await expect(page.getByText("SELECT CANON FACTORY")).toBeVisible({ timeout: 5000 });
    console.log("[Test] On Select Factory page");

    // Step 5: Click 'Arbitrary Action'
    await page.getByText("ARBITRARY ACTION").click();
    await page.waitForTimeout(1000);

    // Verify we're on the Arbitrary Action form
    await expect(page.getByText("Transaction Title", { exact: true })).toBeVisible({ timeout: 5000 });
    console.log("[Test] On Arbitrary Action form");

    // Step 6: Type 'test1' in the transaction title
    const titleInput = page.locator('input[placeholder="Eg. Deposit 1 ETH to Vault..."]');
    await titleInput.fill("test1");

    // Step 7: Fill in target address, calldata, and value
    // Target Address
    const targetInput = page.locator('input[placeholder="0x..."]').first();
    await targetInput.fill(VITALIK_ADDRESS);

    // Calldata
    const calldataInput = page.locator('input[placeholder="0x... (full calldata including selector)"]');
    await calldataInput.fill("0xffffffffff");

    // Value (wei)
    const valueInput = page.locator('input[placeholder="0"]');
    await valueInput.fill("0");

    console.log("[Test] Filled form with test data");

    // Step 8: Click Continue
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForTimeout(1000);

    // Verify we're on the Review page
    await expect(page.getByText("PREVIEW ACTION")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("test1")).toBeVisible();
    console.log("[Test] On Review page");

    // Step 9: Click Initiate
    await page.getByRole("button", { name: /initiate/i }).click();
    await page.waitForTimeout(1000);

    console.log("[Test] Starting signing flow");

    // Step 10: Sign the four transactions
    // Transaction 1/4: Deploy Arbitrary Action
    console.log("[Test] Signing transaction 1/4: Deploy Arbitrary Action");
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();
    await expect(page.getByText("1/4")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 1/4 signed");

    // Transaction 2/4: Save to Canon List
    console.log("[Test] Signing transaction 2/4: Save to Canon List");
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();
    await expect(page.getByText("2/4")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 2/4 signed");

    // Transaction 3/4: Queue Transaction
    console.log("[Test] Signing transaction 3/4: Queue Transaction");
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();
    await expect(page.getByText("3/4")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 3/4 signed");

    // Transaction 4/4: Sign Transaction
    console.log("[Test] Signing transaction 4/4: Sign Transaction");
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^sign$/i }).click();
    await expect(page.getByText("4/4")).toBeVisible({ timeout: 20000 });
    console.log("[Test] Transaction 4/4 signed");

    console.log("[Test] All 4 transactions signed successfully");
    await page.waitForTimeout(2000);

    // Step 11: Click 'View Queue'
    await page.getByRole("button", { name: /view queue/i }).click();
    console.log("[Test] Navigating to queue");

    // Wait for the queue page to load
    await expect(page.getByPlaceholder("Search by name or 0x...")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Queue", { exact: true })).toBeVisible({ timeout: 5000 });
    console.log("[Test] On Queue page");

    // Step 12: Look for the item in "Ready to Execute" section and click Execute
    // The item should be in "Ready to Execute" since it's a 1/1 Safe and we just signed it
    await expect(page.getByText("READY TO EXECUTE")).toBeVisible({ timeout: 10000 });
    console.log("[Test] Found 'Ready to Execute' section");

    // Find and click the Execute button
    await expect(page.getByRole("button", { name: /^execute$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^execute$/i }).click();
    console.log("[Test] Clicked Execute button");

    // Wait for execution to complete
    await page.waitForTimeout(3000);

    console.log("[Test] Arbitrary action created and executed successfully");
  });
});
