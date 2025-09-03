/**
 * Known addresses and RPC URLs for the Canon Guard UI
 */

import { Address } from "viem";

// Demo/Example Safe addresses (real deployed addresses on Optimism mainnet)
export const DEMO_SAFE_WITH_GUARD: Address = "0x275b3926a58AA47Ba66B53725c7ceF9A3D725157";
export const DEMO_GUARD_ADDRESS: Address = "0xfba6ab4dfca44973d52014d16c00053de53a0c26";
export const DEMO_SAFE_NO_GUARD: Address = "0xCec63a937C7daa0147b350fF09E4f1889b64227b";

// Known owner of demo Safe
export const DEMO_SAFE_OWNER: Address = "0xd550780b24C8c25ef1471773498dcb63eF415298"; // EOA

// Known contract addresses for testing/validation
export const USDC_OPTIMISM: Address = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

// RPC URLs
export const OPTIMISM_MAINNET_RPC = "https://mainnet.optimism.io";
