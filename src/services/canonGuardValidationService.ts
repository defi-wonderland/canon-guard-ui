/**
 * Canon Guard Validation Service
 *
 * Provides centralized validation logic to determine if an address
 * is a legitimate Canon Guard deployed from a known factory.
 *
 * 3-step validation:
 * 1. Call PARENT() on the guard - if it fails, not a Canon Guard
 * 2. Check returned factory address against known factories
 * 3. Call factory.isChild(guardAddress) to confirm deployment
 */

import { Address, PublicClient, zeroAddress } from "viem";
import { actionBuilderParentAbi, canonGuardFactoryAbi } from "../abis/canonGuard";
import { getValidationFactoryAddresses } from "../config/canonGuardFactories";

export interface ValidationResult {
  isValid: boolean;
  factoryAddress?: Address;
  error?: string;
}

export class CanonGuardValidationService {
  private client: PublicClient;

  constructor(client: PublicClient) {
    this.client = client;
  }

  /**
   * Validate an address is a legitimate Canon Guard using 3-step check:
   * 1. Call PARENT() - must not fail
   * 2. PARENT() result must be a known factory address
   * 3. Factory.isChild(guardAddress) must return true
   */
  async isValidCanonGuard(guardAddress: Address): Promise<boolean> {
    const result = await this.validateCanonGuard(guardAddress);
    return result.isValid;
  }

  /**
   * Full validation with detailed results
   */
  async validateCanonGuard(guardAddress: Address): Promise<ValidationResult> {
    if (!guardAddress || guardAddress === zeroAddress) {
      return { isValid: false, error: "Invalid or zero address" };
    }

    // Step 1: Try to call PARENT() on the guard
    let factoryAddress: Address;
    try {
      factoryAddress = (await this.client.readContract({
        address: guardAddress,
        abi: actionBuilderParentAbi,
        functionName: "PARENT",
      })) as Address;
    } catch {
      return {
        isValid: false,
        error: "This address is not a supported Canon Guard",
      };
    }

    // Step 2: Check if the factory address is in our known factories list
    const knownFactories = getValidationFactoryAddresses();
    const isKnownFactory = knownFactories.some((known) => known.toLowerCase() === factoryAddress.toLowerCase());

    if (!isKnownFactory) {
      return {
        isValid: false,
        factoryAddress,
        error: `PARENT() returned unknown factory: ${factoryAddress}`,
      };
    }

    // Step 3: Verify the guard is actually a child of the factory
    try {
      const isChild = await this.client.readContract({
        address: factoryAddress,
        abi: canonGuardFactoryAbi,
        functionName: "isChild",
        args: [guardAddress],
      });

      if (!isChild) {
        return {
          isValid: false,
          factoryAddress,
          error: "Factory does not recognize this address as a child",
        };
      }

      return { isValid: true, factoryAddress };
    } catch {
      return {
        isValid: false,
        factoryAddress,
        error: "Failed to verify isChild() on factory",
      };
    }
  }
}
