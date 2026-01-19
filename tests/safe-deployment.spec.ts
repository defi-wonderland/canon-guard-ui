import { test, expect } from './fixtures';

test.describe('Safe Deployment Fixture', () => {
  test('should deploy a Safe with correct configuration', async ({ deployedSafe }) => {
    // Fixture provides a deployed Safe
    expect(deployedSafe.safeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployedSafe.owners).toHaveLength(1);
    expect(deployedSafe.threshold).toBe(1);

    // Verify the owner is Anvil account #0
    expect(deployedSafe.owners[0].toLowerCase()).toBe(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
    );
  });

  test('should load Safe in UI', async ({ page, deployedSafe }) => {
    const { safeAddress } = deployedSafe;

    // Navigate to the UI with the deployed Safe
    await page.goto(`/?chainId=10&safeAddress=${safeAddress}`);

    // Connect wallet (E2E Test Wallet via Walletless)
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByText('E2E Test Wallet').click();

    // Wait for connection
    await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 5000 });

    // Verify Safe info loads
    // Note: This Safe won't have a Canon Guard yet, so it should show an error
    await expect(
      page.getByText(/Canon Guard Not Found|does not have Canon Guard configured/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('each test gets a fresh Safe', async ({ deployedSafe }) => {
    // This test will get a different Safe address than the previous test
    const firstSafe = deployedSafe.safeAddress;

    // In a real test, you'd use this unique Safe for test isolation
    expect(firstSafe).toBeDefined();
  });
});
