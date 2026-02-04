/**
 * Known Canon Guard Factory Addresses
 *
 * This list contains all legitimate Canon Guard factory addresses
 * that are used to validate Canon Guard deployments.
 *
 * When validating a Canon Guard:
 * 1. We call PARENT() on the guard to get its factory
 * 2. We check if that factory is in this list
 * 3. We verify isChild() on the factory
 */

import { getValidationFactoryAddresses } from "./canonGuardFactories";

/**
 * List of known Canon Guard factory addresses across all supported chains.
 * These are deployed via CREATE2 and have the same address on all chains.
 */
export const KNOWN_CANON_GUARD_FACTORIES = getValidationFactoryAddresses();
