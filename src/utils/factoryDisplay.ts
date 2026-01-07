import { ActionFactoryType, HubFactoryType } from "~/types/canon-guard";

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

// Hub factory display names - keyed by HubFactoryType
export const HUB_FACTORY_DISPLAY_NAMES: Record<HubFactoryType, string> = {
  [HubFactoryType.CAPPED_TOKEN_TRANSFERS_HUB]: "Capped Transfer",
};

// Hub-specific display names for UI (keyed by ActionFactoryType for legacy compatibility)
export const HUB_DISPLAY_NAMES: Partial<Record<ActionFactoryType, string>> = {
  [ActionFactoryType.CAPPED_TOKEN_TRANSFERS]: "Cap Transfer",
};

/**
 * Get a user-friendly display name for the factory type
 */
export const getFactoryDisplayName = (factoryType: ActionFactoryType): string => {
  return FACTORY_DISPLAY_NAMES[factoryType] ?? "Unknown";
};

/**
 * Get a user-friendly display name for a hub factory type
 */
export const getHubDisplayName = (factoryType: ActionFactoryType): string => {
  return HUB_DISPLAY_NAMES[factoryType] ?? "Unknown Hub";
};
