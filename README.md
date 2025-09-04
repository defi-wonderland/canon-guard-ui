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

## Tech Stack

- **React** with **Vite** for fast development
- **Material-UI** for UI components and theming
- **RainbowKit** + **Wagmi** + **Viem** for Web3 integration
- **React Router** for navigation

Created by [Wonderland](https://wonderland.xyz).
