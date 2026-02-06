/**
 * Safe Service - Handles all Safe wallet operations
 *
 * Responsibilities:
 * - Read Safe configuration (owners, threshold, nonce)
 * - Detect guard contracts via storage slot reading
 * - Validate Canon Guard deployment via factory check
 */

import { Address, keccak256, toHex, PublicClient, getAddress, zeroAddress } from "viem";
import { safeAbi } from "../abis/safe";
import { SafeInfo } from "../types";
import { CanonGuardValidationService } from "./canonGuardValidationService";
import { ClientService } from "./clientService";

export class SafeService {
  private clientService: ClientService;

  constructor(clientService: ClientService) {
    this.clientService = clientService;
  }

  /**
   * Get the PublicClient instance
   */
  private get client(): PublicClient {
    return this.clientService.getClient();
  }

  /**
   * Get guard address from Safe storage slot
   */
  async getGuardAddress(safe: Address): Promise<Address | null> {
    try {
      // Guard storage slot: keccak256("guard_manager.guard.address")
      const guardSlot = keccak256(toHex("guard_manager.guard.address"));
      const rawGuardData = await this.client.getStorageAt({
        address: safe,
        slot: guardSlot,
      });

      // If no data returned, no guard is set
      if (!rawGuardData) return null;

      // Extract the address from the last 20 bytes (40 hex chars) of the storage slot
      const rawAddress = `0x${rawGuardData.slice(-40)}` as Address;

      // Normalize to checksummed address
      const guardAddress = getAddress(rawAddress);

      // If the extracted address is the zero address, no guard is set
      if (guardAddress === zeroAddress) return null;

      return guardAddress;
    } catch (error) {
      console.error("Failed to get guard address:", error);
      return null;
    }
  }

  /**
   * Validate that a guard address was deployed from a supported CanonGuardFactory
   * This ensures the guard is a legitimate Canon Guard and not an arbitrary contract.
   *
   * Uses 3-step validation:
   * 1. Call PARENT() on the guard - must not fail
   * 2. PARENT() result must be a known factory address
   * 3. Factory.isChild(guardAddress) must return true
   */
  async isValidCanonGuard(guardAddress: Address): Promise<boolean> {
    if (!guardAddress || guardAddress === zeroAddress) {
      return false;
    }

    try {
      const validationService = new CanonGuardValidationService(this.client);
      return await validationService.isValidCanonGuard(guardAddress);
    } catch (error) {
      console.error("Failed to validate Canon Guard:", error);
      return false;
    }
  }

  /**
   * Get complete Safe information using multicall for efficiency
   * Returns info about the Safe and its guard status
   */
  async getSafeInfo(safe: Address): Promise<SafeInfo> {
    const [multicallResults, guardAddress] = await Promise.all([
      this.client.multicall({
        contracts: [
          {
            address: safe,
            abi: safeAbi,
            functionName: "getOwners",
          },
          {
            address: safe,
            abi: safeAbi,
            functionName: "getThreshold",
          },
          {
            address: safe,
            abi: safeAbi,
            functionName: "nonce",
          },
        ],
      }),
      this.getGuardAddress(safe),
    ]);

    const [ownersResult, thresholdResult, nonceResult] = multicallResults;

    if (ownersResult.status === "failure") {
      throw new Error(`Failed to get owners: ${ownersResult.error.message}`);
    }
    if (thresholdResult.status === "failure") {
      throw new Error(`Failed to get threshold: ${thresholdResult.error.message}`);
    }
    if (nonceResult.status === "failure") {
      throw new Error(`Failed to get nonce: ${nonceResult.error.message}`);
    }

    const owners = ownersResult.result as Address[];
    const threshold = Number(thresholdResult.result);
    const nonce = Number(nonceResult.result);
    const chain = this.clientService.getChain();

    // Determine guard status
    const hasGuard = guardAddress !== null;
    let isValidCanonGuard = false;

    if (hasGuard && guardAddress) {
      isValidCanonGuard = await this.isValidCanonGuard(guardAddress);
    }

    return {
      address: safe,
      chainId: chain.id,
      network: chain.name,
      threshold,
      owners,
      totalOwners: owners.length,
      hasGuard,
      isValidCanonGuard,
      guardAddress: guardAddress || undefined,
      nonce,
    };
  }

  /**
   * @deprecated Use getSafeInfo instead
   */
  async getVaultInfo(safe: Address): Promise<SafeInfo> {
    return this.getSafeInfo(safe);
  }
}
