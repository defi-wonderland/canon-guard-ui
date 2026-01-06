/**
 * Chain Configuration - Defines supported chains and their RPC endpoints
 *
 * RPC URLs are loaded from environment variables to keep sensitive data out of code.
 * To add a new chain:
 * 1. Add the RPC URL env var (VITE_RPC_CHAINNAME)
 * 2. Add the chain to SupportedChainId enum
 * 3. Add the chain config to SUPPORTED_CHAINS
 */

import { Chain } from "viem";
import { mainnet, optimism } from "viem/chains";

/**
 * Enum of supported chain IDs for type safety
 */
export enum SupportedChainId {
  ETHEREUM = 1,
  OPTIMISM = 10,
}

/**
 * Configuration for a supported chain
 */
export interface ChainConfig {
  id: SupportedChainId;
  name: string;
  shortName: string;
  chain: Chain;
  rpcUrl: string;
  blockExplorerUrl: string;
  iconColor: string; // For UI display
}

/**
 * Get RPC URL from environment variables with fallback
 */
const getRpcUrl = (envVar: string, fallback: string): string => {
  const url = import.meta.env[envVar];
  return url || fallback;
};

/**
 * Map of supported chains with their configurations
 */
export const SUPPORTED_CHAINS: Record<SupportedChainId, ChainConfig> = {
  [SupportedChainId.ETHEREUM]: {
    id: SupportedChainId.ETHEREUM,
    name: "Ethereum Mainnet",
    shortName: "Ethereum",
    chain: mainnet,
    rpcUrl: getRpcUrl("VITE_RPC_ETHEREUM", "https://eth-mainnet.g.alchemy.com/v2/J9qI8VqN68cHHr4-b4wB2"),
    blockExplorerUrl: "https://etherscan.io",
    iconColor: "#627EEA",
  },
  [SupportedChainId.OPTIMISM]: {
    id: SupportedChainId.OPTIMISM,
    name: "OP Mainnet",
    shortName: "OP Mainnet",
    chain: optimism,
    rpcUrl: getRpcUrl("VITE_RPC_OPTIMISM", "https://opt-mainnet.g.alchemy.com/v2/J9qI8VqN68cHHr4-b4wB2"),
    blockExplorerUrl: "https://optimistic.etherscan.io",
    iconColor: "#FF0420",
  },
};

/**
 * Array of supported chains for iteration (e.g., dropdowns)
 */
export const SUPPORTED_CHAINS_LIST: ChainConfig[] = Object.values(SUPPORTED_CHAINS);

/**
 * Default chain ID
 */
export const DEFAULT_CHAIN_ID = SupportedChainId.ETHEREUM;

/**
 * Get chain config by ID
 */
export const getChainConfig = (chainId: SupportedChainId): ChainConfig => {
  return SUPPORTED_CHAINS[chainId];
};

/**
 * Get RPC URL for a chain
 */
export const getRpcUrlForChain = (chainId: SupportedChainId): string => {
  return SUPPORTED_CHAINS[chainId].rpcUrl;
};

/**
 * Get viem Chain object for a chain ID
 */
export const getViemChain = (chainId: SupportedChainId): Chain => {
  return SUPPORTED_CHAINS[chainId].chain;
};

/**
 * Check if a chain ID is supported
 */
export const isSupportedChain = (chainId: number): chainId is SupportedChainId => {
  return chainId in SUPPORTED_CHAINS;
};

/**
 * Parse chain ID from string (for URL params)
 */
export const parseChainId = (value: string | null): SupportedChainId | null => {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isSupportedChain(parsed) ? parsed : null;
};
