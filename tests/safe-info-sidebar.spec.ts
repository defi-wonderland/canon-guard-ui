import { test, expect, Page } from "@playwright/test";
import {
  DEMO_SAFE_WITH_GUARD,
  DEMO_SAFE_NO_GUARD,
  USDC_OPTIMISM,
  OPTIMISM_MAINNET_RPC,
} from "../src/constants/addresses";

async function fillVaultSetup(page: Page, vaultAddress: string) {
  await page.goto("/");
  await page.getByTestId("vault-address-input").locator("input").fill(vaultAddress);
  await page.getByTestId("rpc-url-input").locator("input").fill(OPTIMISM_MAINNET_RPC);
  await page.getByTestId("continue-to-vault-button").click();
}

test.describe("Safe Validation", () => {
  test("non-Safe contract shows error", async ({ page }) => {
    await fillVaultSetup(page, USDC_OPTIMISM);
    await expect(page.getByText("Failed to load vault data, please try again.")).toBeVisible();
  });

  test("Safe without guard shows error", async ({ page }) => {
    await fillVaultSetup(page, DEMO_SAFE_NO_GUARD);
    await expect(page.getByText("This address is not a Canon Vault, please set it up and try again.")).toBeVisible();
  });

  test("Safe with guard loads successfully", async ({ page }) => {
    await fillVaultSetup(page, DEMO_SAFE_WITH_GUARD);
    // Success means no error messages are shown
    await expect(page.getByText("Failed to load vault data")).not.toBeVisible();
    await expect(page.getByText("This address is not a Canon Vault")).not.toBeVisible();
    // Check queue content is visible (indicates successful load)
    await expect(page.getByText("Queued Actions")).toBeVisible();
  });
});

test.describe("Safe Sidebar Features", () => {
  test.beforeEach(async ({ page }) => {
    await fillVaultSetup(page, DEMO_SAFE_WITH_GUARD);
    // Wait a moment for content to load
    await page.waitForTimeout(1000);
    // Try to expand sidebar if it's collapsed
    try {
      const toggleButton = page.getByTestId("sidebar-toggle");
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // Sidebar might already be expanded, continue
    }
  });

  test("displays Safe info", async ({ page }) => {
    // Check threshold value using test ID
    const threshold = page.getByTestId("safe-threshold");
    await expect(threshold).toBeVisible();
    // Assert exact threshold value for the demo Safe
    await expect(threshold).toHaveText("1/1");

    // Check network name is displayed correctly
    const network = page.getByTestId("safe-network");
    await expect(network).toBeVisible();
    await expect(network).toContainText("OP Mainnet");
  });

  test("opens context menu", async ({ page }) => {
    // Click the more options button using test ID
    await page.getByTestId("safe-more-options").click();
    await expect(page.getByText("Copy Address")).toBeVisible();
  });

  test("clears vault config", async ({ page }) => {
    await page.getByTestId("safe-more-options").click();
    await page.getByText("Clear Vault Configuration").click();
    await expect(page.getByText("Setup Canon Vault")).toBeVisible();
  });
});
