# 🏦 Canon Guard UI

A web application for managing Canon Guard multisig security system. Canon Guard adds timelock protection to Gnosis Safe operations, preventing immediate transaction execution and providing time to review and stop malicious actions.

## What is Canon Guard?

Canon Guard transforms your Safe from "execute immediately" to "execute thoughtfully" by adding mandatory delays and approval systems. This provides hack protection and reduces manual review work for common transactions.

📖 **[Read the complete Canon Guard guide →](CANON_GUARD_CONCEPTS.md)**

## Quick Start

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

   Add your API keys from [WalletConnect Cloud](https://cloud.walletconnect.com) and [Alchemy Dashboard](https://dashboard.alchemy.com).

3. **Start development server**:
   ```bash
   pnpm run dev
   ```

## Testing

```bash
# Run all tests
pnpm run test

# Unit tests only
pnpm run test:unit

# E2E tests only
pnpm run test:e2e
```

## E2E Testing

Canon Guard UI uses Playwright with Walletless for fast, reliable E2E testing.

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   pnpm playwright:install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Add your RPC URLs for forking
   ```

### Running Tests

```bash
# Run all tests (unit + E2E)
pnpm test

# Run only E2E tests
pnpm test:e2e

# Run with Playwright UI (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug tests/wallet-connection.spec.ts
```

### How It Works

- **Walletless**: Provides a mock wallet that signs transactions automatically
- **Anvil**: Local fork of Optimism mainnet for realistic testing
- **No Extensions**: No MetaMask or other browser extensions needed
- **Fast**: 16x faster than traditional wallet testing

### Writing Tests

Example test:

```typescript
import { test, expect } from '@playwright/test';

test('should connect wallet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await page.getByText('E2E Test Wallet').click();
  await expect(page.getByText(/0xf39f/i)).toBeVisible();
});
```

See `tests/` directory for more examples.

## Tech Stack

- **React** with **Vite** for fast development
- **Material-UI** for UI components and theming
- **RainbowKit** + **Wagmi** + **Viem** for Web3 integration
- **React Router** for navigation

Created by [Wonderland](https://wonderland.xyz).
