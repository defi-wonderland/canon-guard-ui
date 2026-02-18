import type { Address } from "viem";

/**
 * Token metadata from a static token list (e.g., Uniswap default list).
 * Used for the token selector dropdown.
 */
export interface TokenInfo {
  chainId: number;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}
