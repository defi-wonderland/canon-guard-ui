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
import { getEnv } from "./env";

const { IS_PLAYWRIGHT } = getEnv();

/**
 * Test RPC URLs for Playwright/Anvil testing
 * These point to local Anvil instances for each chain
 */
export const TEST_RPC_URLS = {
  [optimism.id]: "http://127.0.0.1:8545",
  [mainnet.id]: "http://127.0.0.1:8546",
} as const;

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
interface ChainConfig {
  id: SupportedChainId;
  name: string;
  shortName: string;
  chain: Chain;
  rpcUrl: string | undefined; // undefined allows viem's http() to use public fallback
  blockExplorerUrl: string;
  iconColor: string; // For UI display
}

/**
 * Get RPC URL from environment variables
 * Falls back to undefined which allows viem's http() transport to use public RPCs
 */
const getRpcUrl = (envVar: string): string | undefined => {
  return import.meta.env[envVar] || undefined;
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
    rpcUrl: IS_PLAYWRIGHT ? TEST_RPC_URLS[mainnet.id] : getRpcUrl("VITE_RPC_ETHEREUM"),
    blockExplorerUrl: "https://etherscan.io",
    iconColor: "#627EEA",
  },
  [SupportedChainId.OPTIMISM]: {
    id: SupportedChainId.OPTIMISM,
    name: "OP Mainnet",
    shortName: "OP Mainnet",
    chain: optimism,
    rpcUrl: IS_PLAYWRIGHT ? TEST_RPC_URLS[optimism.id] : getRpcUrl("VITE_RPC_OPTIMISM"),
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
export const getRpcUrlForChain = (chainId: SupportedChainId): string | undefined => {
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
