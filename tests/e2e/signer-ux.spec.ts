import { CHAIN_CONFIG, TEST_TIMEOUTS } from "./constants";
import { test, expect } from "./fixtures";

/**
 * Tests for signer-based UX:
 * - CREATE button visibility/disabled state based on signer status
 * - Canon List action buttons visibility/disabled state
 *
 * Note: These tests focus on signer vs non-signer scenarios.
 * The e2e wallet is always "connected" when using the mock provider,
 * so we test the disabled state when connected as a non-signer.
 *
 * Uses deployment[2] for main tests to avoid conflicts with other test files.
 */
test.describe("Signer UX Controls", () => {
  test.describe("CREATE Button", () => {
    test("should show enabled CREATE button and navigate when connected as signer", async ({
      page,
      deployments,
      switchToDeployment,
    }) => {
      const deployment = deployments[2];
      const { safeAddress } = deployment.safe;
      const { guardAddress } = deployment.canonGuard;

      // Navigate directly to app with query params to bypass setup
      await page.goto(
        `/?chainId=${CHAIN_CONFIG.OP_MAINNET.id}&safeAddress=${safeAddress}&guardAddress=${guardAddress}`,
      );
      await page.waitForLoadState("networkidle");

      // Switch to the correct signing account (the Safe owner)
      await switchToDeployment(deployment);

      // Wait for the main app to load
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

      // CREATE button should be visible
      const createButton = page.getByTestId("create-button");
      await expect(createButton).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

      // Click should navigate to create page (button is enabled for signer)
      await createButton.click();
      await page.waitForTimeout(500);
      await expect(page.getByTestId("create-page-title")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });
    });

    test("should show disabled CREATE button with tooltip when connected as non-signer", async ({
      page,
      deployments,
      switchToDeployment,
    }) => {
      const deployment = deployments[2];
      const { safeAddress } = deployment.safe;
      const { guardAddress } = deployment.canonGuard;

      // Navigate directly to app with query params
      await page.goto(
        `/?chainId=${CHAIN_CONFIG.OP_MAINNET.id}&safeAddress=${safeAddress}&guardAddress=${guardAddress}`,
      );
      await page.waitForLoadState("networkidle");

      // Switch to a different deployment's account (NOT a signer for deployment[2]'s Safe)
      // Use deployment[0] which has a different owner
      const nonSignerDeployment = deployments[0];
      await switchToDeployment(nonSignerDeployment);

      // Wait for the main app to load
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

      // CREATE button should be visible (wallet is connected)
      const createButton = page.getByTestId("create-button");
      await expect(createButton).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

      // Hover over CREATE button to verify tooltip appears
      await createButton.hover();
      await page.waitForTimeout(500);

      // Check that the tooltip with "not a signer" message appears
      await expect(page.getByText("Connected wallet is not a signer")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

      // Click should NOT navigate (button is disabled)
      await createButton.click();
      await page.waitForTimeout(500);

      // Should still be on queue page, not create page
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
      await expect(page.getByTestId("create-page-title")).not.toBeVisible();
    });
  });

  test.describe("Canon List Action Buttons", () => {
    test("should show enabled QUEUE button when connected as signer", async ({
      page,
      deployments,
      switchToDeployment,
    }) => {
      const deployment = deployments[2];
      const { safeAddress } = deployment.safe;
      const { guardAddress } = deployment.canonGuard;

      // Navigate to app
      await page.goto(
        `/?chainId=${CHAIN_CONFIG.OP_MAINNET.id}&safeAddress=${safeAddress}&guardAddress=${guardAddress}`,
      );
      await page.waitForLoadState("networkidle");
      await switchToDeployment(deployment);

      // Wait for app to load
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

      // Navigate to Canon List
      await page.getByTestId("canon-list-button").click();
      await expect(page.getByTestId("canon-list-title")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

      // Wait for items to load
      await page.waitForTimeout(1000);

      // Check if there are any items in the list
      const queueButtons = page.getByTestId("canon-list-queue-button");
      const count = await queueButtons.count();

      if (count > 0) {
        // QUEUE button should be visible
        await expect(queueButtons.first()).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

        // Hover should NOT show "not a signer" tooltip for signer
        await queueButtons.first().hover();
        await page.waitForTimeout(300);
        await expect(page.getByText("Connected wallet is not a signer")).not.toBeVisible();
      }
    });

    test("should show disabled QUEUE button with tooltip when connected as non-signer", async ({
      page,
      deployments,
      switchToDeployment,
    }) => {
      const deployment = deployments[2];
      const { safeAddress } = deployment.safe;
      const { guardAddress } = deployment.canonGuard;

      // Navigate to app
      await page.goto(
        `/?chainId=${CHAIN_CONFIG.OP_MAINNET.id}&safeAddress=${safeAddress}&guardAddress=${guardAddress}`,
      );
      await page.waitForLoadState("networkidle");

      // Switch to a non-signer account (use deployment[0] which has a different owner)
      const nonSignerDeployment = deployments[0];
      await switchToDeployment(nonSignerDeployment);

      // Wait for app to load
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

      // Navigate to Canon List
      await page.getByTestId("canon-list-button").click();
      await expect(page.getByTestId("canon-list-title")).toBeVisible({ timeout: TEST_TIMEOUTS.MEDIUM });

      // Wait for items to load
      await page.waitForTimeout(1000);

      // Check if there are any items in the list
      const queueButtons = page.getByTestId("canon-list-queue-button");
      const count = await queueButtons.count();

      if (count > 0) {
        // QUEUE button should be visible but disabled
        await expect(queueButtons.first()).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });

        // Hover to see tooltip
        await queueButtons.first().hover();
        await page.waitForTimeout(500);
        await expect(page.getByText("Connected wallet is not a signer")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
      }
    });
  });

  test.describe("Execute Button Tooltip", () => {
    test("should show disabled execute button with tooltip when connected as non-signer", async ({
      page,
      deployments,
      switchToDeployment,
    }) => {
      const deployment = deployments[2];
      const { safeAddress } = deployment.safe;
      const { guardAddress } = deployment.canonGuard;

      // Navigate to app
      await page.goto(
        `/?chainId=${CHAIN_CONFIG.OP_MAINNET.id}&safeAddress=${safeAddress}&guardAddress=${guardAddress}`,
      );
      await page.waitForLoadState("networkidle");

      // First, set up as signer to see the queue
      await switchToDeployment(deployment);

      // Wait for app to load
      await expect(page.getByTestId("queue-search-input")).toBeVisible({ timeout: TEST_TIMEOUTS.LONG });

      // Check if there are any executable items
      const executeButtons = page.getByTestId("execute-button");
      const count = await executeButtons.count();

      if (count > 0) {
        // Now switch to non-signer (use deployment[0] which has a different owner)
        const nonSignerDeployment = deployments[0];
        await switchToDeployment(nonSignerDeployment);

        // Wait for UI to update
        await page.waitForTimeout(500);

        // Hover over execute button to see tooltip
        await executeButtons.first().hover();
        await page.waitForTimeout(500);

        // Should show signer warning
        await expect(page.getByText("Connected wallet is not a signer")).toBeVisible({ timeout: TEST_TIMEOUTS.SHORT });
      }
    });
  });
});
