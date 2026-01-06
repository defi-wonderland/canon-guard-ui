export { SelectFactoryStep } from "./SelectFactoryStep";
export { TransferFormStep } from "./TransferFormStep";
export { SimpleActionFormStep } from "./SimpleActionFormStep";
export { ClaimAllowanceFormStep } from "./ClaimAllowanceFormStep";
export { ReviewDeployStep } from "./ReviewDeployStep";
export { SigningFlowStep } from "./SigningFlowStep";

// Types
export type TransferFormData = {
  title: string;
  tokenAddress: string;
  recipientAddress: string;
  amount: string;
};

export type SimpleActionFormData = {
  title: string;
  target: string;
  signature: string;
  data: string;
  value: string;
};

export type ClaimAllowanceFormData = {
  title: string;
  token: string;
  tokenOwner: string;
  tokenRecipient: string;
};

export type FactoryType =
  | "simple-action"
  | "transfer"
  | "claim-allowance"
  | "pre-approve"
  | "turn-off-emergency"
  | null;
