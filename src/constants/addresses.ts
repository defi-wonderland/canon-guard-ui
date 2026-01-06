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
