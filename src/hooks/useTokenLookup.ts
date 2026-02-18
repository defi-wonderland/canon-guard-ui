import { useCallback, useRef, useState } from "react";
import { type Address, erc20Abi, isAddress } from "viem";
import { useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import { findTokenByAddress, getTokensByChainId } from "~/constants/tokenList";
import type { TokenInfo } from "~/types/token";

interface TokenLookupResult {
  token: TokenInfo | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for looking up token metadata.
 * First checks the local static token list, then falls back to onchain RPC fetching.
 * Caches previously fetched tokens to avoid repeated RPC calls.
 */
export function useTokenLookup(chainId: number) {
  const config = useConfig();
  const [customTokens, setCustomTokens] = useState<Map<string, TokenInfo>>(new Map());
  const pendingLookups = useRef<Set<string>>(new Set());

  /** Get all tokens for the current chain (static list + custom fetched tokens) */
  const getTokensForChain = useCallback((): TokenInfo[] => {
    const staticTokens = getTokensByChainId(chainId);
    const customForChain = Array.from(customTokens.values()).filter((t) => t.chainId === chainId);
    return [...staticTokens, ...customForChain];
  }, [chainId, customTokens]);

  /** Find a token in the combined list (static + custom) */
  const findToken = useCallback(
    (address: string): TokenInfo | undefined => {
      // Check static list first
      const staticToken = findTokenByAddress(address, chainId);
      if (staticToken) return staticToken;

      // Then check custom fetched tokens
      const key = `${chainId}:${address.toLowerCase()}`;
      return customTokens.get(key);
    },
    [chainId, customTokens],
  );

  /** Look up a token by address, fetching onchain if not found in static list */
  const lookupToken = useCallback(
    async (address: string): Promise<TokenLookupResult> => {
      if (!address || !isAddress(address)) {
        return { token: null, isLoading: false, error: null };
      }

      // Check static list first
      const existing = findToken(address);
      if (existing) {
        return { token: existing, isLoading: false, error: null };
      }

      // Prevent duplicate concurrent lookups for the same address
      const key = `${chainId}:${address.toLowerCase()}`;
      if (pendingLookups.current.has(key)) {
        return { token: null, isLoading: true, error: null };
      }

      pendingLookups.current.add(key);

      try {
        // Fetch symbol and decimals onchain
        const [symbol, decimals] = await Promise.all([
          readContract(config, {
            address: address as Address,
            abi: erc20Abi,
            functionName: "symbol",
          }),
          readContract(config, {
            address: address as Address,
            abi: erc20Abi,
            functionName: "decimals",
          }),
        ]);

        const token: TokenInfo = {
          chainId,
          address: address as Address,
          name: symbol, // Use symbol as name for unknown tokens
          symbol,
          decimals,
          logoURI: "", // No logo for custom tokens - fallback icon will be used
        };

        setCustomTokens((prev) => {
          const next = new Map(prev);
          next.set(key, token);
          return next;
        });

        return { token, isLoading: false, error: null };
      } catch {
        return { token: null, isLoading: false, error: "Could not fetch token data. Verify the address is correct." };
      } finally {
        pendingLookups.current.delete(key);
      }
    },
    [chainId, config, findToken],
  );

  return {
    getTokensForChain,
    findToken,
    lookupToken,
  };
}
