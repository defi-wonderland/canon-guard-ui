# E2E Testing Guide for Canon Guard UI

## Architecture

### Components

1. **Walletless** (`@wonderland/walletless`)
   - Mock EIP-1193 provider
   - Automatic transaction signing
   - No browser extension required
   - Works with any E2E framework

2. **Anvil** (via Foundry)
   - Local Ethereum node
   - Forks from real networks (Ethereum, Optimism)
   - Fast block times
   - Deterministic test accounts

3. **Playwright** (`@playwright/test`)
   - Modern E2E testing framework
   - Parallel test execution
   - Rich debugging tools
   - Cross-browser support

### Flow

```
Test Start
    ↓
Playwright starts Anvil (fork Optimism)
    ↓
Playwright starts dev server (VITE_PUBLIC_IS_PLAYWRIGHT=true)
    ↓
Wagmi loads e2eConnector (instead of real wallets)
    ↓
Test interacts with app
    ↓
Walletless signs transactions automatically
    ↓
Transactions execute on Anvil fork
    ↓
Test assertions verify results
```

## Writing Tests

### Basic Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup common to all tests
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Connecting Wallet

```typescript
async function connectWallet(page) {
  await page.getByRole('button', { name: /connect/i }).click();
  await page.getByText('E2E Test Wallet').click();
  await expect(page.getByText(/0xf39f/i)).toBeVisible();
}
```

### Signing Transactions

Transactions are signed automatically! No need to interact with wallet popups.

```typescript
test('should approve transaction', async ({ page }) => {
  await page.getByRole('button', { name: /approve/i }).click();

  // That's it! Transaction is signed automatically
  await expect(page.getByText(/success/i)).toBeVisible();
});
```

### Switching Accounts (Advanced)

```typescript
// TODO: Requires provider reference setup
// See Walletless docs for setSigningAccount()
```

### Switching Chains (Advanced)

```typescript
// TODO: Requires provider reference setup
// See Walletless docs for setChain()
```

## Best Practices

1. **Use test data attributes**: Add `data-testid` to components for stable selectors
2. **Wait for wallet connection**: Always wait for address to appear before interactions
3. **Use realistic data**: Test with real Safe addresses from Optimism mainnet
4. **Check on-chain state**: Verify that transactions actually affect contract state
5. **Avoid timing dependencies**: Use Playwright's auto-waiting, not arbitrary delays

## Debugging

### Playwright UI Mode

```bash
pnpm test:e2e:ui
```

Best for: Understanding test flow, watching tests run, time-travel debugging

### Debug Mode

```bash
pnpm test:e2e:debug tests/my-test.spec.ts
```

Best for: Step-by-step debugging with browser DevTools

### Headed Mode

```bash
pnpm test:e2e:headed
```

Best for: Seeing browser interactions in real-time

### Check Anvil Logs

Anvil runs in a webServer, so logs appear in Playwright output:

```bash
pnpm test:e2e 2>&1 | grep -A 5 "anvil"
```

## Common Issues

### "Cannot connect to Anvil"

**Cause**: Anvil not started or wrong RPC URL

**Solution**:
1. Check that `RPC_URL_TESTING=http://127.0.0.1:8545` in `.env`
2. Verify Anvil is running: `curl http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

### "E2E Test Wallet not appearing"

**Cause**: `VITE_PUBLIC_IS_PLAYWRIGHT` not set

**Solution**: Check that playwright.config.ts passes the env var to webServer

### "Transaction reverts"

**Cause**: Test account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) is not a Safe owner

**Solution**:
1. Use a Safe where this address is an owner, OR
2. Impersonate an actual owner on the Anvil fork (advanced)

## Performance Tips

1. **Reuse Anvil instance**: Set `reuseExistingServer: true` in playwright.config.ts
2. **Run tests in parallel**: Walletless supports parallel execution
3. **Use test.beforeEach sparingly**: Only for truly common setup
4. **Cache static data**: Don't re-fetch unchanging contract data

## Migration from Synpress

| Synpress | Walletless |
|----------|------------|
| `testWithSynpress()` | `test()` |
| MetaMask extension | No extension |
| Manual confirmations | Automatic signing |
| Single worker | Parallel execution |
| 34s test suite | 2s test suite |

To migrate:
1. Replace `testWithSynpress` with `test`
2. Remove MetaMask interaction code
3. Remove `await metamask.confirmTransaction()` calls
4. Update playwright.config.ts (remove extension flags)

## Advanced Topics

### Account Switching

To switch signing accounts during a test:

```typescript
// TODO: Requires provider reference setup
// This allows testing multi-signer workflows
```

### Chain Switching

To switch chains during a test:

```typescript
// TODO: Requires provider reference setup
// This allows testing cross-chain scenarios
```

### Transaction Rejection

To test rejection flows:

```typescript
// TODO: Configure Walletless to reject specific transactions
// See Walletless docs for setRejectSignature()
```

### Impersonation

To impersonate specific addresses on the Anvil fork:

```typescript
// TODO: Use Anvil's impersonate feature
// anvil_impersonateAccount RPC call
```

## Examples

See the following test files for examples:
- `tests/wallet-connection.spec.ts` - Basic wallet connection
- `tests/transaction-signing.spec.ts` - Transaction signing flows
- `tests/url-params.spec.ts` - URL parameter handling
- `tests/safe-info-sidebar.spec.ts` - Safe information display

## Resources

- [Walletless Documentation](https://github.com/wonderland-org/walletless)
- [Playwright Documentation](https://playwright.dev)
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)
- [Wagmi Testing Guide](https://wagmi.sh/core/guides/testing)
