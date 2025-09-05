import { test, expect } from "@playwright/test";
import { DEMO_SAFE_WITH_GUARD, OPTIMISM_MAINNET_RPC } from "../src/constants/addresses";

test.describe("URL Parameters", () => {
  test("automatically loads vault when safeAddress and rpcUrl are in URL", async ({ page }) => {
    const encodedRpcUrl = encodeURIComponent(OPTIMISM_MAINNET_RPC);
    const urlWithParams = `/?safeAddress=${DEMO_SAFE_WITH_GUARD}&rpcUrl=${encodedRpcUrl}`;

    await page.goto(urlWithParams);

    await expect(page.getByText("Setup Canon Vault")).not.toBeVisible();
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    await expect(page.getByText("Queue Management")).toBeVisible({ timeout: 15000 });
  });

  test("shows setup modal when URL params are missing", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Setup Canon Vault")).toBeVisible();
    await expect(page.getByTestId("vault-address-input")).toBeVisible();
    await expect(page.getByTestId("rpc-url-input")).toBeVisible();
  });

  test("shows setup modal when safeAddress is invalid", async ({ page }) => {
    const encodedRpcUrl = encodeURIComponent(OPTIMISM_MAINNET_RPC);
    const urlWithInvalidAddress = `/?safeAddress=invalid-address&rpcUrl=${encodedRpcUrl}`;

    await page.goto(urlWithInvalidAddress);

    await expect(page.getByText("Setup Canon Vault")).toBeVisible();
  });

  test("shows setup modal when rpcUrl is missing", async ({ page }) => {
    const urlWithMissingRpc = `/?safeAddress=${DEMO_SAFE_WITH_GUARD}`;

    await page.goto(urlWithMissingRpc);

    await expect(page.getByText("Setup Canon Vault")).toBeVisible();
  });

  test("shows setup modal when rpcUrl is invalid", async ({ page }) => {
    const urlWithInvalidRpc = `/?safeAddress=${DEMO_SAFE_WITH_GUARD}&rpcUrl=not-a-url`;

    await page.goto(urlWithInvalidRpc);

    await expect(page.getByText("Setup Canon Vault")).toBeVisible();
  });
});
