import { test, expect } from '@playwright/test';
import { DEMO_SAFE_WITH_GUARD, DEMO_SAFE_OWNER } from '../src/constants/addresses';

test.describe('Transaction Signing', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate and connect wallet
    await page.goto(`/?chainId=10&safeAddress=${DEMO_SAFE_WITH_GUARD}`);
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByText('E2E Test Wallet').click();
    await expect(page.getByText(/0xf39f/i)).toBeVisible();
  });

  test('should approve queued transaction', async ({ page }) => {
    // Navigate to queue
    await page.getByRole('link', { name: /queue/i }).click();

    // Find a queued transaction
    const queueItem = page.locator('[data-testid="queue-item"]').first();
    await expect(queueItem).toBeVisible();

    // Click approve button
    await queueItem.getByRole('button', { name: /approve/i }).click();

    // Transaction signing happens automatically with Walletless!
    // Wait for success message
    await expect(page.getByText(/approved/i)).toBeVisible({ timeout: 15000 });
  });

  test('should handle transaction rejection', async ({ page }) => {
    // Note: Would need to configure Walletless to reject
    // This demonstrates the control you have over the wallet

    // For now, just verify the reject flow exists
    await page.getByRole('link', { name: /queue/i }).click();
    const queueItem = page.locator('[data-testid="queue-item"]').first();

    // Verify cancel/reject option exists
    await expect(queueItem.getByRole('button', { name: /cancel/i })).toBeVisible();
  });
});
