import { ActionFactoryType } from "~/types/canon-guard";

// Centralized factory display names - single source of truth
// Use proper capitalization here; CSS handles uppercase display where needed
export const FACTORY_DISPLAY_NAMES: Partial<Record<ActionFactoryType, string>> = {
  [ActionFactoryType.SIMPLE_TRANSFERS]: "Transfer",
  [ActionFactoryType.CAPPED_TOKEN_TRANSFERS]: "Capped Transfer",
  [ActionFactoryType.SIMPLE_ACTIONS]: "Arbitrary Action",
  [ActionFactoryType.APPROVE_ACTION]: "Pre-Approve",
  [ActionFactoryType.ALLOWANCE_CLAIMOR]: "Claim Allowance",
  [ActionFactoryType.CHANGE_SAFE_GUARD]: "Change Guard",
  [ActionFactoryType.SET_EMERGENCY_CALLER]: "Emergency Caller",
  [ActionFactoryType.SET_EMERGENCY_TRIGGER]: "Emergency Trigger",
  [ActionFactoryType.EVERCLEAR_TOKEN_CONVERSION]: "Token Conversion",
  [ActionFactoryType.OPX_ACTION]: "OPx Action",
};

/**
 * Get a user-friendly display name for the factory type
 */
export const getFactoryDisplayName = (factoryType: ActionFactoryType): string => {
  return FACTORY_DISPLAY_NAMES[factoryType] ?? "Unknown";
};
