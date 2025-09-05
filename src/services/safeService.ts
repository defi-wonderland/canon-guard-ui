/**
 * Safe Service - Handles all Safe wallet operations
 *
 * Responsibilities:
 * - Read Safe configuration (owners, threshold, nonce)
 * - Detect guard contracts via storage slot reading
 */

import { Address, keccak256, toHex, PublicClient } from "viem";
import { ZERO_ADDRESS } from "~/utils/hex";
import { safeAbi } from "../abis/safe";
import { SafeInfo } from "../types";
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
      const guardAddress = `0x${rawGuardData.slice(-40)}` as Address;

      // If the extracted address is the zero address, no guard is set
      if (guardAddress === ZERO_ADDRESS) return null;

      return guardAddress;
    } catch (error) {
      console.error("Failed to get guard address:", error);
      return null;
    }
  }

  /**
   * Validate Canon Guard entrypoint
   */
  async isValidCanonGuardEntrypoint(): Promise<boolean> {
    // TODO: Implement this by checking if the guard address is a valid Canon Guard entrypoint
    return true;
  }

  /**
   * Get complete vault information using multicall for efficiency
   */
  async getVaultInfo(safe: Address): Promise<SafeInfo> {
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
    return {
      address: safe,
      chainId: chain.id,
      network: chain.name,
      threshold,
      owners,
      totalOwners: owners.length,
      // TODO: Verify that the guard address is a valid Canon Guard entrypoint
      hasCanonGuard: guardAddress !== null,
      guardAddress: guardAddress || undefined,
      nonce,
    };
  }
}
