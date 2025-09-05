/**
 * Known addresses and RPC URLs for the Canon Guard UI
 */

import { Address } from "viem";

// Demo/Example Safe addresses (real deployed addresses on Optimism mainnet)
export const DEMO_SAFE_WITH_GUARD: Address = "0x67b93164914eE3AD6065cE75935AEb8928051787"; // Safe with 2/3 threshold
export const DEMO_GUARD_ADDRESS: Address = "0xe53d45e11897B1FB5aC94f675589072E838CFd1d";
export const DEMO_SAFE_NO_GUARD: Address = "0xCec63a937C7daa0147b350fF09E4f1889b64227b"; // Old 1/1 Safe for testing no-guard scenarios

// Known owner of demo Safe
export const DEMO_SAFE_OWNER: Address = "0xd550780b24C8c25ef1471773498dcb63eF415298"; // EOA

// Known contract addresses for testing/validation
export const USDC_OPTIMISM: Address = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

// RPC URLs
export const OPTIMISM_MAINNET_RPC = "https://mainnet.optimism.io";
