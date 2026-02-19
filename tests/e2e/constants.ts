/**
 * E2E Test Constants
 *
 * Centralized constants for E2E tests to avoid duplication
 */

import type { Address, Hex } from "viem";

/**
 * Anvil's well-known accounts (same as @wonderland/walletless ANVIL_ACCOUNTS)
 * Each deployment index uses a different account to avoid nonce conflicts in parallel tests
 */
export const ANVIL_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address,
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as Hex,
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address,
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as Hex,
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as Address,
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as Hex,
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as Address,
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" as Hex,
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" as Address,
    privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" as Hex,
  },
] as const;

/**
 * Anvil's well-known private key for account 0 (for backwards compatibility)
 * Public address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 */
export const ANVIL_PRIVATE_KEY = ANVIL_ACCOUNTS[0].privateKey;

/**
 * Anvil account 0 address (for backwards compatibility)
 */
export const ANVIL_ACCOUNT_ADDRESS = ANVIL_ACCOUNTS[0].address;

/**
 * Vitalik's address - used for test transactions
 */
export const VITALIK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;

/**
 * USDC token address on Optimism
 */
export const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address;

/**
 * USDC whale address on Optimism - used for funding Safes in tests
 * This is the USDC token contract itself which holds a large balance
 */
export const USDC_WHALE_OPTIMISM = "0xf89d7b9c864f589bbF53a82105107622B35EaA40" as Address;

/**
 * Default Anvil RPC URL
 */
export const ANVIL_RPC_URL = "http://127.0.0.1:8545";

/**
 * Chain configuration
 */
export const CHAIN_CONFIG = {
  OP_MAINNET: {
    id: 10,
    name: "OP Mainnet",
    label: "OP Mainnet",
  },
} as const;

/**
 * Safe v1.4.1 deployment addresses (same across all EVM chains)
 */
export const SAFE_ADDRESSES = {
  SAFE_PROXY_FACTORY: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67" as Address,
  SAFE_SINGLETON: "0x41675C099F32341bf84BFc5382aF534df5C7461a" as Address,
  FALLBACK_HANDLER: "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4" as Address,
} as const;

/**
 * Test timeouts (in milliseconds)
 */
export const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 15000,
  TRANSACTION: 20000,
} as const;

/**
 * Canon Guard default configuration for tests
 */
export const CANON_GUARD_CONFIG = {
  /** Short execution delay in seconds (0 second for fast testing) */
  shortTxExecutionDelay: 0n,
  /** Long execution delay in seconds (1 seconds for fast testing) */
  longTxExecutionDelay: 1n,
  /** Transaction expiry delay in seconds (7 days) */
  txExpiryDelay: 604800n,
  /** Max approval duration in seconds (~4 months) */
  maxApprovalDuration: 10368000n,
} as const;
