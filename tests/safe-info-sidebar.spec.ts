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

    await expect(page.getByText("Failed to load vault data")).not.toBeVisible();
    await expect(page.getByText("This address is not a Canon Vault")).not.toBeVisible();

    await expect(page.getByText("Queued Actions")).toBeVisible();
  });
});

test.describe("Safe Sidebar Features", () => {
  test.beforeEach(async ({ page }) => {
    await fillVaultSetup(page, DEMO_SAFE_WITH_GUARD);
    await page.waitForTimeout(1000);

    const toggleButton = page.getByTestId("sidebar-toggle");
    await toggleButton.click();
    await page.waitForTimeout(500);
  });

  test("displays Safe info", async ({ page }) => {
    const threshold = page.getByTestId("safe-threshold");
    const network = page.getByTestId("safe-network");

    await expect(threshold).toBeVisible();
    await expect(network).toBeVisible();
    await expect(threshold).toHaveText("1/1");
    await expect(network).toContainText("OP Mainnet");
  });

  test("opens context menu", async ({ page }) => {
    await page.getByTestId("safe-more-options").click();

    await expect(page.getByText("Copy Address")).toBeVisible();
  });

  test("clears vault config", async ({ page }) => {
    await page.getByTestId("safe-more-options").click();
    await page.getByText("Clear Vault Configuration").click();

    await expect(page.getByText("Setup Canon Vault")).toBeVisible();
  });
});
