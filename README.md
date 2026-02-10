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

## Feature & Test Coverage

Overview of all application features and their current test coverage status.

### Guard Setup & Configuration

- [x] Deploy Canon Guard via in-app wizard — `deploy-canon-guard.spec.ts`
- [x] Attach Canon Guard (initial setup flow) — `attach-canon-guard.spec.ts`
- [x] Attach Canon Guard (Settings page) — `settings-attach-flow.spec.ts`
- [x] Detach Canon Guard from Safe — `settings-attach-flow.spec.ts`
- [x] Detached mode banner and Learn More panel — `settings-attach-flow.spec.ts`

### Transaction Creation

- [x] Create arbitrary action and execute — `attach-canon-guard.spec.ts`
- [x] Create transfer action and execute — `settings-attach-flow.spec.ts`
- [x] Create hub action with pre-approval and execute — `attach-canon-guard.spec.ts`
- [ ] Create claim allowance action
- [ ] Form validation edge cases

### Queue Management

- [x] Execute queued transactions — covered across multiple E2E specs
- [x] Queue from Canon List and execute — `settings-attach-flow.spec.ts`
- [ ] Search and filter queue items
- [ ] Transaction expiry handling
- [ ] Countdown timer accuracy

### Canon List

- [x] Queue saved action from Canon List — `settings-attach-flow.spec.ts`
- [ ] Search Canon List items
- [ ] Rename items
- [ ] Remove items from Canon List

### Pre-Approval System

- [x] Create and execute pre-approval — `attach-canon-guard.spec.ts`
- [ ] Remove existing pre-approval

### Safe & Wallet Management

- [x] Add and manage multiple Safes — `deploy-canon-guard.spec.ts`
- [ ] Chain switching
- [ ] WalletConnect integration (connect dApp, pre-fill forms)

### Signer UX Controls

- [x] CREATE button enabled/disabled based on signer status — `signer-ux.spec.ts`
- [x] QUEUE button enabled/disabled based on signer status — `signer-ux.spec.ts`
- [x] Execute button disabled for non-signer — `signer-ux.spec.ts`

### Emergency Mode

- [x] Activate emergency mode — `settings-attach-flow.spec.ts`
- [x] Deactivate emergency mode — `settings-attach-flow.spec.ts`

### Settings & Inspection

- [ ] Action detail modal (Overview, Details, Simulate tabs)
- [ ] Nonce management and recommendation logic

### Unit Tests

- [x] CanonGuardService — queue data processing, empty state, error handling — `canonGuardService.test.ts`
- [x] ClientService — initialization, client retrieval, RPC URL updates — `clientService.test.ts`
- [x] SafeService — vault info aggregation, guard address detection — `safeService.test.ts`
- [x] Address truncation utility — `utils.test.ts`

## Tech Stack

- **React** with **Vite** for fast development
- **Material-UI** for UI components and theming
- **RainbowKit** + **Wagmi** + **Viem** for Web3 integration
- **React Router** for navigation

Created by [Wonderland](https://wonderland.xyz).
