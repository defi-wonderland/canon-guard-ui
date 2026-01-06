import { Address } from "viem";
import { ActionFactoryType } from "../types/canon-guard";

// Delay in milliseconds to wait after a transaction is confirmed before refetching data.
// This gives RPC nodes time to index the new blockchain state.
export const RPC_INDEXING_DELAY_MS = 2000;

// Core contract addresses (deployed via CREATE2, same across all chains)
export const CANON_GUARD_REGISTRY: Address = "0x1d6f006964fBDf260B06cA38283Ec952B51f4f84";
export const PRE_APPROVE_ACTION_FACTORY: Address = "0x2A62b0644BA7F4648179BfAE9a279D63DC44eF4a";
export const SIMPLE_TRANSFERS_FACTORY: Address = "0xC2E8c09Eb985Dd34285bc154D1B6886e6886aE54";
export const SIMPLE_ACTIONS_FACTORY: Address = "0xEE501087737570c780C3C219A0d3FFf2d86417a4";
export const ALLOWANCE_CLAIMOR_FACTORY: Address = "0x6636eDd0125880677f3a1f7411555ea64411d60E";

// Canon Guard factory addresses from scripts/scripts/Constants.s.sol
// These are deployed via CREATE2 and share the same addresses across all supported chains
export const KNOWN_FACTORY_MAPPINGS: Record<Address, { type: ActionFactoryType; label: string }> = {
  // Core factories (all chains)
  "0x656c264F914bd8Fe7bbAfb9B4F2EBcB4f259F67C": {
    type: ActionFactoryType.SAFE_ENTRYPOINT,
    label: "Canon Guard Factory",
  },
  "0x6636eDd0125880677f3a1f7411555ea64411d60E": {
    type: ActionFactoryType.ALLOWANCE_CLAIMOR,
    label: "Allowance Claimor Factory",
  },
  "0x2A62b0644BA7F4648179BfAE9a279D63DC44eF4a": {
    type: ActionFactoryType.APPROVE_ACTION,
    label: "Pre-Approve Action Factory",
  },
  "0x8531f72986374445507c29A0753fcc9cA36468D0": {
    type: ActionFactoryType.CAPPED_TOKEN_TRANSFERS,
    label: "Capped Token Transfers Hub Factory",
  },
  "0xEE501087737570c780C3C219A0d3FFf2d86417a4": {
    type: ActionFactoryType.SIMPLE_ACTIONS,
    label: "Simple Actions Factory",
  },
  "0xC2E8c09Eb985Dd34285bc154D1B6886e6886aE54": {
    type: ActionFactoryType.SIMPLE_TRANSFERS,
    label: "Simple Transfers Factory",
  },
  "0xE4Fd8EBFC17aA71b41E15143D35FCE6F48cB1a38": {
    type: ActionFactoryType.CHANGE_SAFE_GUARD,
    label: "Change Safe Guard Action Factory",
  },
  "0xDeA9DC1E5f5ac14A923A198349e3D175C3F8D175": {
    type: ActionFactoryType.SET_EMERGENCY_CALLER,
    label: "Set Emergency Caller Action Factory",
  },
  "0x701f4342800ddF69F00f7be7d32240d70E586568": {
    type: ActionFactoryType.SET_EMERGENCY_TRIGGER,
    label: "Set Emergency Trigger Action Factory",
  },
  // Chain-specific factories
  // Ethereum Mainnet only
  "0xB926E033a519bC7e073aaC9B8eD81b2D6D6C48Cd": {
    type: ActionFactoryType.EVERCLEAR_TOKEN_CONVERSION,
    label: "Everclear Token Conversion Factory",
  },
  // OP Mainnet only
  "0x4161480e48C715e076916a4Dce70A61c74193D37": {
    type: ActionFactoryType.OPX_ACTION,
    label: "OPx Action Factory",
  },
};

export const FACTORY_ADDRESSES = Object.keys(KNOWN_FACTORY_MAPPINGS) as Address[];

export const getFactoryType = (actionBuilderAddress: Address): ActionFactoryType => {
  const mapping = KNOWN_FACTORY_MAPPINGS[actionBuilderAddress];
  return mapping?.type || ActionFactoryType.UNKNOWN;
};

export const FACTORY_TYPE_TO_LABEL: Record<ActionFactoryType, string> = {
  [ActionFactoryType.SAFE_ENTRYPOINT]: "Canon Guard Factory",
  [ActionFactoryType.ALLOWANCE_CLAIMOR]: "Allowance Claimor Factory",
  [ActionFactoryType.APPROVE_ACTION]: "Pre-Approve Action Factory",
  [ActionFactoryType.CAPPED_TOKEN_TRANSFERS]: "Capped Token Transfers Hub Factory",
  [ActionFactoryType.SIMPLE_ACTIONS]: "Simple Actions Factory",
  [ActionFactoryType.SIMPLE_TRANSFERS]: "Simple Transfers Factory",
  [ActionFactoryType.CHANGE_SAFE_GUARD]: "Change Safe Guard Action Factory",
  [ActionFactoryType.SET_EMERGENCY_CALLER]: "Set Emergency Caller Action Factory",
  [ActionFactoryType.SET_EMERGENCY_TRIGGER]: "Set Emergency Trigger Action Factory",
  [ActionFactoryType.EVERCLEAR_TOKEN_CONVERSION]: "Everclear Token Conversion Factory",
  [ActionFactoryType.OPX_ACTION]: "OPx Action Factory",
  [ActionFactoryType.UNKNOWN]: "Unknown Factory",
};

export const getFactoryLabel = (actionBuilderAddress: Address): string => {
  const mapping = KNOWN_FACTORY_MAPPINGS[actionBuilderAddress];
  return mapping?.label || FACTORY_TYPE_TO_LABEL[ActionFactoryType.UNKNOWN];
};

export const getFactoryLabelByType = (factoryType: ActionFactoryType): string => {
  return FACTORY_TYPE_TO_LABEL[factoryType] || FACTORY_TYPE_TO_LABEL[ActionFactoryType.UNKNOWN];
};
