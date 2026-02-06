/**
 * useSafeStorage - React hook for managing saved safes in localStorage
 *
 * Provides reactive state and methods for safe storage operations.
 */

import { useState, useCallback, useEffect } from "react";
import { Address } from "viem";
import { SupportedChainId } from "~/config/chains";
import { SafeStorageService, SavedSafe } from "~/services";

interface UseSafeStorageReturn {
  /** All saved safes sorted by lastUsed */
  savedSafes: SavedSafe[];
  /** The currently selected safe */
  currentSafe: SavedSafe | null;
  /** Safes other than the current one */
  previousSafes: SavedSafe[];
  /** Number of saved safes */
  savedSafesCount: number;
  /** Whether there are any saved safes */
  hasSavedSafes: boolean;
  /** Save a new safe or update existing */
  saveSafe: (safe: Omit<SavedSafe, "lastUsed" | "addedAt">) => void;
  /** Set a safe as the current one */
  switchSafe: (address: Address, chainId: SupportedChainId) => void;
  /** Remove a saved safe */
  removeSafe: (address: Address, chainId: SupportedChainId) => void;
  /** Update guard address for a safe */
  updateGuardAddress: (address: Address, chainId: SupportedChainId, guardAddress: Address, isDetached: boolean) => void;
  /** Refresh state from storage */
  refresh: () => void;
}

/**
 * Hook for managing saved safes with reactive state
 */
export const useSafeStorage = (): UseSafeStorageReturn => {
  const [savedSafes, setSavedSafes] = useState<SavedSafe[]>(() => SafeStorageService.getSavedSafes());
  const [currentSafe, setCurrentSafe] = useState<SavedSafe | null>(() => SafeStorageService.getCurrentSafe());
  const [previousSafes, setPreviousSafes] = useState<SavedSafe[]>(() => SafeStorageService.getPreviousSafes());

  // Refresh all state from storage
  const refresh = useCallback(() => {
    setSavedSafes(SafeStorageService.getSavedSafes());
    setCurrentSafe(SafeStorageService.getCurrentSafe());
    setPreviousSafes(SafeStorageService.getPreviousSafes());
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "canon-guard-saved-safes") {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refresh]);

  const saveSafe = useCallback(
    (safe: Omit<SavedSafe, "lastUsed" | "addedAt">) => {
      SafeStorageService.saveSafe(safe);
      refresh();
    },
    [refresh],
  );

  const switchSafe = useCallback(
    (address: Address, chainId: SupportedChainId) => {
      SafeStorageService.setCurrentSafe(address, chainId);
      refresh();
    },
    [refresh],
  );

  const removeSafe = useCallback(
    (address: Address, chainId: SupportedChainId) => {
      SafeStorageService.removeSafe(address, chainId);
      refresh();
    },
    [refresh],
  );

  const updateGuardAddress = useCallback(
    (address: Address, chainId: SupportedChainId, guardAddress: Address, isDetached: boolean) => {
      SafeStorageService.updateGuardAddress(address, chainId, guardAddress, isDetached);
      refresh();
    },
    [refresh],
  );

  return {
    savedSafes,
    currentSafe,
    previousSafes,
    savedSafesCount: savedSafes.length,
    hasSavedSafes: savedSafes.length > 0,
    saveSafe,
    switchSafe,
    removeSafe,
    updateGuardAddress,
    refresh,
  };
};
