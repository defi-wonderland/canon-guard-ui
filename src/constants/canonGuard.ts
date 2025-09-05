import { Address } from "viem";
import { ActionFactoryType } from "../types/canon-guard";

// Real Canon Guard factory addresses from @canon-guard-scripts/scripts/Constants.s.sol
export const KNOWN_FACTORY_MAPPINGS: Record<Address, { type: ActionFactoryType; label: string }> = {
  "0x82386Bc221fc4C8FE8a1aBBCb9ba63d9379DE1dE": {
    type: ActionFactoryType.SAFE_ENTRYPOINT,
    label: "Safe Entrypoint Factory",
  },
  "0x22caFedbd199b77241ff862Da076a951709f0f66": {
    type: ActionFactoryType.ALLOWANCE_CLAIMOR,
    label: "Allowance Claimor Factory",
  },
  "0x7B836eB789A63E22686709b95745b50bf271DBB3": {
    type: ActionFactoryType.APPROVE_ACTION,
    label: "Approve Action Factory",
  },
  "0x3F3a4aA6f3F48f607f1CE98994C510D830dF39D9": {
    type: ActionFactoryType.CAPPED_TOKEN_TRANSFERS,
    label: "Capped Token Transfers Hub Factory",
  },
  "0xB63Bd0e55d3026d4a06C482b4c193E835EeD66b1": {
    type: ActionFactoryType.SIMPLE_ACTIONS,
    label: "Simple Actions Factory",
  },
  "0xEE6c9f2Ced068f0389f437B830A511f054F5cc9B": {
    type: ActionFactoryType.SIMPLE_TRANSFERS,
    label: "Simple Transfers Factory",
  },
};

export const FACTORY_ADDRESSES = Object.keys(KNOWN_FACTORY_MAPPINGS) as Address[];

export const getFactoryType = (actionBuilderAddress: Address): ActionFactoryType => {
  const mapping = KNOWN_FACTORY_MAPPINGS[actionBuilderAddress];
  return mapping?.type || ActionFactoryType.UNKNOWN;
};

export const FACTORY_TYPE_TO_LABEL: Record<ActionFactoryType, string> = {
  [ActionFactoryType.SAFE_ENTRYPOINT]: "Safe Entrypoint Factory",
  [ActionFactoryType.ALLOWANCE_CLAIMOR]: "Allowance Claimor Factory",
  [ActionFactoryType.APPROVE_ACTION]: "Approve Action Factory",
  [ActionFactoryType.CAPPED_TOKEN_TRANSFERS]: "Capped Token Transfers Hub Factory",
  [ActionFactoryType.SIMPLE_ACTIONS]: "Simple Actions Factory",
  [ActionFactoryType.SIMPLE_TRANSFERS]: "Simple Transfers Factory",
  [ActionFactoryType.UNKNOWN]: "Unknown Factory",
};

export const getFactoryLabel = (actionBuilderAddress: Address): string => {
  const mapping = KNOWN_FACTORY_MAPPINGS[actionBuilderAddress];
  return mapping?.label || FACTORY_TYPE_TO_LABEL[ActionFactoryType.UNKNOWN];
};

export const getFactoryLabelByType = (factoryType: ActionFactoryType): string => {
  return FACTORY_TYPE_TO_LABEL[factoryType] || FACTORY_TYPE_TO_LABEL[ActionFactoryType.UNKNOWN];
};
