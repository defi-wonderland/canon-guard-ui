/**
 * Canon Guard Factory Registry
 *
 * Centralized registry for Canon Guard factories with their capabilities.
 * This makes it easy to add new factories and manage their capabilities.
 */

import { Address } from "viem";

/**
 * Capabilities that a Canon Guard factory can have
 */
export enum CanonGuardFactoryCapability {
  /** Factory can validate guards via isChild() */
  VALIDATE = "validate",
  /** Factory can deploy guards via createCanonGuard() */
  DEPLOY = "deploy",
}

/**
 * Configuration for a Canon Guard factory
 */
export interface CanonGuardFactoryConfig {
  /** Factory contract address (same on all supported chains via CREATE2) */
  address: Address;
  /** Human-readable label for the factory */
  label: string;
  /** Capabilities supported by this factory */
  capabilities: CanonGuardFactoryCapability[];
  /** If true, this is the preferred factory for deployment */
  isDefaultForDeploy?: boolean;
}

/**
 * Registry of all known Canon Guard factories
 */
export const CANON_GUARD_FACTORIES: CanonGuardFactoryConfig[] = [
  {
    address: "0x656c264F914bd8Fe7bbAfb9B4F2EBcB4f259F67C",
    label: "Canon Guard Factory (Legacy)",
    capabilities: [CanonGuardFactoryCapability.VALIDATE],
  },
  {
    address: "0x7567a9C9432D05add20055057De22f5B2fBe56FF",
    label: "Canon Guard Factory",
    capabilities: [CanonGuardFactoryCapability.VALIDATE, CanonGuardFactoryCapability.DEPLOY],
    isDefaultForDeploy: true,
  },
];

/**
 * Get all factories with a specific capability
 */
export const getFactoriesWithCapability = (cap: CanonGuardFactoryCapability): CanonGuardFactoryConfig[] =>
  CANON_GUARD_FACTORIES.filter((f) => f.capabilities.includes(cap));

/**
 * Get the default factory for deploying new Canon Guards
 */
export const getDeployFactory = (): CanonGuardFactoryConfig | undefined =>
  CANON_GUARD_FACTORIES.find((f) => f.isDefaultForDeploy);

/**
 * Get all factory addresses that can validate guards
 */
export const getValidationFactoryAddresses = (): Address[] =>
  getFactoriesWithCapability(CanonGuardFactoryCapability.VALIDATE).map((f) => f.address);

/**
 * Check if an address is a known factory
 */
export const isKnownFactory = (address: Address): boolean =>
  CANON_GUARD_FACTORIES.some((f) => f.address.toLowerCase() === address.toLowerCase());
