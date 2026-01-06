import { useCallback } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { SupportedChainId, isSupportedChain } from "~/config/chains";

/**
 * Centralized hook for wallet connection management
 * Wraps wagmi and RainbowKit hooks into a single interface
 */
export function useWallet() {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  /**
   * Switch to a specific chain
   * Returns true if successful, false otherwise
   */
  const switchToChain = useCallback(
    async (targetChainId: SupportedChainId): Promise<boolean> => {
      if (!isConnected) {
        console.warn("Cannot switch chain: wallet not connected");
        return false;
      }

      if (chainId === targetChainId) {
        return true; // Already on correct chain
      }

      try {
        await switchChainAsync({ chainId: targetChainId });
        return true;
      } catch (error) {
        console.error("Failed to switch chain:", error);
        return false;
      }
    },
    [isConnected, chainId, switchChainAsync],
  );

  /**
   * Check if wallet is on the correct chain
   */
  const isOnCorrectChain = useCallback(
    (targetChainId: SupportedChainId): boolean => {
      return chainId === targetChainId;
    },
    [chainId],
  );

  /**
   * Check if current chain is a supported chain
   */
  const isOnSupportedChain = chainId ? isSupportedChain(chainId) : false;

  /**
   * Open the RainbowKit connect modal
   */
  const connect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    chainId,
    isOnSupportedChain,

    // Actions
    connect,
    disconnect,
    switchToChain,
    isOnCorrectChain,

    // Loading states
    isSwitchingChain,
  };
}

export type UseWalletReturn = ReturnType<typeof useWallet>;
