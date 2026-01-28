/**
 * Known addresses for the Canon Guard UI
 */

import { Address } from "viem";

// Canon Guard Factory address (deployed via CREATE2, same on all supported chains)
// From: contracts/scripts/Constants.s.sol
export const CANON_GUARD_FACTORY: Address = "0x656c264F914bd8Fe7bbAfb9B4F2EBcB4f259F67C";

// MultiSendCallOnly address (Safe standard deployment)
export const MULTI_SEND_CALL_ONLY: Address = "0x9641d764fc13c8B624c04430C7356C1C7C8102e2";

// Test Constants (Optimism Mainnet Fork)
// These addresses are for E2E testing with Anvil forks
export const DEMO_SAFE_WITH_GUARD: Address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"; // Example Safe with Canon Guard
export const DEMO_GUARD_ADDRESS: Address = "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD"; // Example guard address
