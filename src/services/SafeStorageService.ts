/**
 * SafeStorageService - Manages saved safes in localStorage
 *
 * This service handles persisting and retrieving safe account information
 * from browser localStorage, enabling multi-safe management.
 */

import { Address } from "viem";
import { SupportedChainId } from "~/config/chains";

const STORAGE_KEY = "canon-guard-saved-safes";

/**
 * Represents a saved safe account
 */
export interface SavedSafe {
  address: Address;
  chainId: SupportedChainId;
  guardAddress?: Address;
  isDetached: boolean;
  lastUsed: number; // timestamp
  addedAt: number; // timestamp
}

/**
 * Storage structure for localStorage
 */
interface SafeStorageData {
  currentSafeKey: string | null; // "address:chainId" format
  safes: Record<string, SavedSafe>;
}

/**
 * Generate a unique key for a safe based on address and chainId
 */
const getSafeKey = (address: Address, chainId: SupportedChainId): string => {
  return `${address.toLowerCase()}:${chainId}`;
};

/**
 * Parse a safe key back to address and chainId
 */
const parseSafeKey = (key: string): { address: Address; chainId: SupportedChainId } | null => {
  const parts = key.split(":");
  if (parts.length !== 2) return null;

  const address = parts[0] as Address;
  const chainId = parseInt(parts[1], 10) as SupportedChainId;

  return { address, chainId };
};

/**
 * Get storage data from localStorage
 */
const getStorageData = (): SafeStorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { currentSafeKey: null, safes: {} };
    }
    return JSON.parse(data) as SafeStorageData;
  } catch (error) {
    console.error("Failed to parse safe storage data:", error);
    return { currentSafeKey: null, safes: {} };
  }
};

/**
 * Save storage data to localStorage
 */
const setStorageData = (data: SafeStorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save safe storage data:", error);
  }
};

/**
 * SafeStorageService - Static methods for managing saved safes
 */
export const SafeStorageService = {
  /**
   * Check if there are any saved safes
   */
  hasSavedSafes(): boolean {
    const data = getStorageData();
    return Object.keys(data.safes).length > 0;
  },

  /**
   * Get the count of saved safes
   */
  getSavedSafesCount(): number {
    const data = getStorageData();
    return Object.keys(data.safes).length;
  },

  /**
   * Get all saved safes sorted by lastUsed (most recent first)
   */
  getSavedSafes(): SavedSafe[] {
    const data = getStorageData();
    return Object.values(data.safes).sort((a, b) => b.lastUsed - a.lastUsed);
  },

  /**
   * Get the currently selected safe
   */
  getCurrentSafe(): SavedSafe | null {
    const data = getStorageData();
    if (!data.currentSafeKey) return null;
    return data.safes[data.currentSafeKey] || null;
  },

  /**
   * Get a specific safe by address and chainId
   */
  getSafe(address: Address, chainId: SupportedChainId): SavedSafe | null {
    const data = getStorageData();
    const key = getSafeKey(address, chainId);
    return data.safes[key] || null;
  },

  /**
   * Save or update a safe
   */
  saveSafe(safe: Omit<SavedSafe, "lastUsed" | "addedAt"> & { lastUsed?: number; addedAt?: number }): void {
    const data = getStorageData();
    const key = getSafeKey(safe.address, safe.chainId);
    const existingSafe = data.safes[key];

    const now = Date.now();
    data.safes[key] = {
      ...safe,
      address: safe.address.toLowerCase() as Address,
      lastUsed: safe.lastUsed ?? now,
      addedAt: existingSafe?.addedAt ?? safe.addedAt ?? now,
    };

    setStorageData(data);
  },

  /**
   * Set a safe as the current safe (also updates lastUsed)
   */
  setCurrentSafe(address: Address, chainId: SupportedChainId): void {
    const data = getStorageData();
    const key = getSafeKey(address, chainId);

    // Update lastUsed if the safe exists
    if (data.safes[key]) {
      data.safes[key].lastUsed = Date.now();
    }

    data.currentSafeKey = key;
    setStorageData(data);
  },

  /**
   * Update the guard address for a saved safe
   */
  updateGuardAddress(address: Address, chainId: SupportedChainId, guardAddress: Address, isDetached: boolean): void {
    const data = getStorageData();
    const key = getSafeKey(address, chainId);

    if (data.safes[key]) {
      data.safes[key].guardAddress = guardAddress;
      data.safes[key].isDetached = isDetached;
      setStorageData(data);
    }
  },

  /**
   * Remove a saved safe
   */
  removeSafe(address: Address, chainId: SupportedChainId): void {
    const data = getStorageData();
    const key = getSafeKey(address, chainId);

    delete data.safes[key];

    // If we removed the current safe, clear it
    if (data.currentSafeKey === key) {
      // Set to the most recently used remaining safe, or null
      const remainingSafes = Object.entries(data.safes).sort(([, a], [, b]) => b.lastUsed - a.lastUsed);
      data.currentSafeKey = remainingSafes.length > 0 ? remainingSafes[0][0] : null;
    }

    setStorageData(data);
  },

  /**
   * Clear all saved safes
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Get all safes except the current one (for "Previously Used" section)
   */
  getPreviousSafes(): SavedSafe[] {
    const data = getStorageData();
    const currentKey = data.currentSafeKey;

    return Object.entries(data.safes)
      .filter(([key]) => key !== currentKey)
      .map(([, safe]) => safe)
      .sort((a, b) => b.lastUsed - a.lastUsed);
  },

  /**
   * Utility to parse a safe key
   */
  parseSafeKey,

  /**
   * Utility to generate a safe key
   */
  getSafeKey,
};
