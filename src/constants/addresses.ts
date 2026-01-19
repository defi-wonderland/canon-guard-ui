/**
 * Known addresses for the Canon Guard UI
 */

import { Address } from "viem";

// Canon Guard Factory address (deployed via CREATE2, same on all supported chains)
// From: contracts/scripts/Constants.s.sol
export const CANON_GUARD_FACTORY: Address = "0x656c264F914bd8Fe7bbAfb9B4F2EBcB4f259F67C";

// MultiSendCallOnly address (Safe standard deployment)
export const MULTI_SEND_CALL_ONLY: Address = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2";

// Known contract addresses for testing/validation
export const USDC_OPTIMISM: Address = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

// Test Constants (Optimism Mainnet Fork)
// These addresses are for E2E testing with Anvil forks
export const DEMO_SAFE_WITH_GUARD: Address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"; // Example Safe with Canon Guard
export const DEMO_SAFE_NO_GUARD: Address = "0x1234567890123456789012345678901234567890"; // Example Safe without guard
export const DEMO_GUARD_ADDRESS: Address = "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD"; // Example guard address
export const DEMO_SAFE_OWNER: Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Anvil account #0

// Anvil default accounts (for testing only)
export const ANVIL_ACCOUNT_0: Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const ANVIL_ACCOUNT_1: Address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// RPC Configuration (for tests)
export const OPTIMISM_MAINNET_RPC = "http://127.0.0.1:8545";
