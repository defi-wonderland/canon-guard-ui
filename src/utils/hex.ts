/**
 * Hex string utilities for blockchain operations
 */

import { Address, Hex } from "viem";

/**
 * Generate a zero-filled hex string of specified byte length
 * @param bytes - Number of bytes (default 32 for storage slots, 20 for addresses)
 * @returns Zero-filled hex string with 0x prefix
 */
export function generateZeroHex(bytes: number = 32): Hex {
  return `0x${"00".repeat(bytes)}` as Hex;
}

/**
 * Zero address (20 bytes of zeros)
 */
export const zeroAddress: Address = generateZeroHex(20);

/**
 * Zero storage slot (32 bytes of zeros)
 */
export const ZERO_STORAGE_SLOT: Hex = generateZeroHex(32);
