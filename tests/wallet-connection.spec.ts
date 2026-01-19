import { test, expect } from '@playwright/test';
import { DEMO_SAFE_WITH_GUARD } from '../src/constants/addresses';

test.describe('Wallet Connection with Walletless', () => {
  test('should connect E2E test wallet', async ({ page }) => {
    await page.goto('/');

    // Click connect wallet button
    await page.getByRole('button', { name: /connect/i }).click();

    // Should show E2E Test Wallet in the list
    await expect(page.getByText('E2E Test Wallet')).toBeVisible();

    // Click E2E wallet
    await page.getByText('E2E Test Wallet').click();

    // Wallet should connect automatically (no popup!)
    await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 5000 });
  });

  test('should load Safe with Canon Guard', async ({ page }) => {
    // Navigate with Safe parameters
    await page.goto(`/?chainId=10&safeAddress=${DEMO_SAFE_WITH_GUARD}`);

    // Connect wallet
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByText('E2E Test Wallet').click();

    // Should load Safe info
    await expect(page.getByText(/safe/i)).toBeVisible();

    // Should show queue section
    await expect(page.getByText(/queue/i)).toBeVisible();
  });

  test('should read on-chain data', async ({ page }) => {
    await page.goto(`/?chainId=10&safeAddress=${DEMO_SAFE_WITH_GUARD}`);

    // Connect wallet
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByText('E2E Test Wallet').click();

    // Wait for Canon Guard config to load
    await expect(page.getByText(/delay/i)).toBeVisible({ timeout: 10000 });

    // Verify delay values are displayed
    await expect(page.locator('text=/\\d+ (hour|day)/i')).toBeVisible();
  });
});
