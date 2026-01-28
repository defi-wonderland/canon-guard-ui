// Re-export time unit types from centralized file
export type { EpochTimeUnit as TimeUnit } from "~/utils/timeUnits";
import type { EpochTimeUnit } from "~/utils/timeUnits";

export { SelectFactoryStep } from "./SelectFactoryStep";
export { TransferFormStep } from "./TransferFormStep";
export { ArbitraryActionFormStep } from "./ArbitraryActionFormStep";
export { ClaimAllowanceFormStep } from "./ClaimAllowanceFormStep";
export { ReviewDeployStep } from "./ReviewDeployStep";
export { SigningFlowStep } from "./SigningFlowStep";

// Hub-specific step components
export { SelectHubTypeStep } from "./SelectHubTypeStep";
export { CappedTransferHubFormStep } from "./CappedTransferHubFormStep";
export { HubReviewStep } from "./HubReviewStep";

// Hub child deployment components
export { DeployHubChildFormStep } from "./DeployHubChildFormStep";
export type { HubChildFormData } from "./DeployHubChildFormStep";
export { DeployHubChildReviewStep } from "./DeployHubChildReviewStep";

// Types for individual items (used in arrays)
export type TransferItem = {
  tokenAddress: string;
  recipientAddress: string;
  amount: string;
};

export type ArbitraryActionItem = {
  target: string;
  signature: string;
  data: string;
  value: string;
};

// Form data types (contain arrays of items)
export type TransferFormData = {
  title: string;
  transfers: TransferItem[];
};

export type ArbitraryActionFormData = {
  title: string;
  actions: ArbitraryActionItem[];
};

export type ClaimAllowanceFormData = {
  title: string;
  token: string;
  tokenOwner: string;
  tokenRecipient: string;
};

export type FactoryType =
  | "arbitrary-action"
  | "transfer"
  | "claim-allowance"
  | "pre-approve"
  | "turn-off-emergency"
  | null;

// Hub types
export type HubType = "capped-transfer-hub" | null;

export type CappedTransferHubFormData = {
  title: string;
  recipientAddress: string;
  epochLength: string;
  epochUnit: EpochTimeUnit;
  tokens: Array<{ address: string; amount: string }>;
};
