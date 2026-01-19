import { test as base } from '@playwright/test';
import type { Address } from 'viem';
import { deploySafe, type DeploySafeResult } from './utils/deploySafe';

/**
 * Extended test fixtures with Safe deployment
 */
export type TestFixtures = {
  /**
   * A freshly deployed 1/1 Safe wallet on the Anvil fork
   *
   * The Safe is deployed before the test runs and is ready to use.
   * Owner: Anvil account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
   *
   * @example
   * ```typescript
   * test('should interact with Safe', async ({ page, deployedSafe }) => {
   *   const { safeAddress } = deployedSafe;
   *   await page.goto(`/?chainId=10&safeAddress=${safeAddress}`);
   *   // ... test code
   * });
   * ```
   */
  deployedSafe: DeploySafeResult;
};

/**
 * Extended Playwright test with Safe deployment fixture
 */
export const test = base.extend<TestFixtures>({
  deployedSafe: async ({}, use) => {
    // Setup: Deploy a new Safe before the test
    console.log('[Fixture] Deploying Safe...');
    const safe = await deploySafe({
      rpcUrl: 'http://127.0.0.1:8545',
      threshold: 1,
    });
    console.log(`[Fixture] Safe deployed at: ${safe.safeAddress}`);

    // Provide the Safe to the test
    await use(safe);

    // Teardown: Safe remains on the Anvil fork
    // (Anvil is reset between test runs by Playwright config)
    console.log('[Fixture] Test completed with Safe:', safe.safeAddress);
  },
});

export { expect } from '@playwright/test';
