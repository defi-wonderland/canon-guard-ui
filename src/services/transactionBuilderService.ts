/**
 * Transaction Builder Service - Builds transaction steps for Canon Guard operations
 *
 * Responsibilities:
 * - Build transaction metadata based on user selections (deploy, propose, pre-approve)
 * - Encode contract calls for deployment, queuing, and signing
 * - Provide transaction data for wallet signing
 */

import { Address, Hex, encodeFunctionData, parseUnits } from "viem";
import {
  simpleTransfersFactoryAbi,
  simpleActionFactoryAbi,
  allowanceClaimorFactoryAbi,
  cappedTokenTransfersHubFactoryAbi,
  canonGuardRegistryAbi,
  canonGuardEntrypointAbi,
  preApproveActionFactoryAbi,
  safeAbi,
} from "../abis/canonGuard";
import { cappedTokenTransfersHubAbi } from "../abis/canonGuard";
import {
  CANON_GUARD_REGISTRY,
  PRE_APPROVE_ACTION_FACTORY,
  SIMPLE_TRANSFERS_FACTORY,
  SIMPLE_ACTIONS_FACTORY,
  ALLOWANCE_CLAIMOR_FACTORY,
  CAPPED_TOKEN_TRANSFERS_HUB_FACTORY,
} from "../constants/canonGuard";
import { EPOCH_TIME_MULTIPLIERS } from "../utils/timeUnits";
import type {
  TransferFormData,
  SimpleActionFormData,
  ClaimAllowanceFormData,
  CappedTransferHubFormData,
  HubChildFormData,
} from "../components/NewAction/steps";

// Transaction step status
export type TransactionStepStatus = "pending" | "waiting" | "signed" | "error";

// Transaction step definition
export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: TransactionStepStatus;
  to: Address;
  data: Hex;
  value?: bigint;
}

// Options for building transaction steps
export interface BuildTransactionStepsOptions {
  formData: TransferFormData;
  safeAddress: Address;
  guardAddress: Address;
  proposeTransaction: boolean;
  proposePreApproval: boolean;
  approvalDurationSeconds?: bigint; // User-provided duration in seconds
}

// Result of building transaction steps
export interface TransactionStepsResult {
  steps: TransactionStep[];
  actionBuilderAddress?: Address; // Predicted address from CREATE2
}

// Default pre-approval duration (1 hour = 3600 seconds) - used only if not specified
const DEFAULT_PRE_APPROVAL_DURATION = 3600n;

/**
 * Builds the list of transaction steps based on checkbox selections
 */
export function buildTransactionSteps(options: BuildTransactionStepsOptions): TransactionStepsResult {
  const { formData, safeAddress, guardAddress, proposeTransaction, proposePreApproval, approvalDurationSeconds } =
    options;

  // Use the user-provided duration or fall back to default
  const preApprovalDuration = approvalDurationSeconds ?? DEFAULT_PRE_APPROVAL_DURATION;

  const steps: TransactionStep[] = [];

  // Build array of transfer actions from form data
  const transferActions = formData.transfers.map((transfer) => ({
    token: transfer.tokenAddress as Address,
    to: transfer.recipientAddress as Address,
    amount: parseUnits(transfer.amount || "0", 18),
  }));

  // 1. MANDATORY: Deploy Action Builder
  // This deploys a SimpleTransfers action via the factory
  // The factory takes an array of TransferAction tuples: [{token, to, amount}]
  const deployData = encodeFunctionData({
    abi: simpleTransfersFactoryAbi,
    functionName: "createSimpleTransfers",
    args: [transferActions],
  });

  steps.push({
    id: "deploy-action",
    title: "Deploy Transfer Action",
    description: "Deploy the transfer action builder contract",
    status: "pending",
    to: SIMPLE_TRANSFERS_FACTORY,
    data: deployData,
  });

  // 2. MANDATORY: Record in Registry
  // For now, we use a placeholder address since we can't predict CREATE2 address client-side
  // In a real implementation, this would need to be done after deployment or use CREATE2 prediction
  // record(address _canonGuard, address[] _entities, string[] _labels)
  const recordData = encodeFunctionData({
    abi: canonGuardRegistryAbi,
    functionName: "record",
    args: [
      guardAddress, // _canonGuard
      ["0x0000000000000000000000000000000000000000" as Address], // _entities - placeholder array
      [formData.title || "Untitled Transfer"], // _labels array
    ],
  });

  steps.push({
    id: "record-registry",
    title: "Save to Canon List",
    description: "Save the action for future use",
    status: "pending",
    to: CANON_GUARD_REGISTRY,
    data: recordData,
  });

  // 3. OPTIONAL: Propose Transaction (queue + sign)
  if (proposeTransaction) {
    // Queue the action in the guard
    const queueData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: [
        "0x0000000000000000000000000000000000000000" as Address, // _actionsBuilder - placeholder
      ],
    });

    steps.push({
      id: "queue-action",
      title: "Queue Transaction",
      description: "Add the transaction to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queueData,
    });

    // Sign the transaction in the Safe
    // For Safe signing, we need to call approveHash with the safeTxHash
    // This requires computing the hash, which depends on the action being queued
    // For now, we use a placeholder
    const approveHashData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: [
        "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, // hash - placeholder
      ],
    });

    steps.push({
      id: "sign-safe-tx",
      title: "Sign Transaction",
      description: "Sign the transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: approveHashData,
    });
  }

  // 4. OPTIONAL: Propose Pre-Approval
  if (proposePreApproval) {
    // Deploy the pre-approve action
    // createPreApproveAction takes: _actionsBuilder, _approvalDuration
    const deployPreApproveData = encodeFunctionData({
      abi: preApproveActionFactoryAbi,
      functionName: "createPreApproveAction",
      args: [
        "0x0000000000000000000000000000000000000000" as Address, // _actionsBuilder - placeholder (the action to approve)
        preApprovalDuration, // _approvalDuration (user-provided duration)
      ],
    });

    steps.push({
      id: "deploy-preapprove",
      title: "Deploy Pre-Approval",
      description: "Deploy the pre-approval action contract",
      status: "pending",
      to: PRE_APPROVE_ACTION_FACTORY,
      data: deployPreApproveData,
    });

    // Queue the pre-approve action
    const queuePreApproveData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: [
        "0x0000000000000000000000000000000000000000" as Address, // _preApproveAction - placeholder
      ],
    });

    steps.push({
      id: "queue-preapprove",
      title: "Queue Pre-Approval",
      description: "Add the pre-approval to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queuePreApproveData,
    });

    // Sign the pre-approve transaction
    const signPreApproveData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: [
        "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, // hash - placeholder
      ],
    });

    steps.push({
      id: "sign-preapprove",
      title: "Sign Pre-Approval",
      description: "Sign the pre-approval transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: signPreApproveData,
    });
  }

  return { steps };
}

// Options for building Simple Action transaction steps
export interface BuildSimpleActionStepsOptions {
  formData: SimpleActionFormData;
  safeAddress: Address;
  guardAddress: Address;
  proposeTransaction: boolean;
  proposePreApproval: boolean;
  approvalDurationSeconds?: bigint;
}

/**
 * Builds the list of transaction steps for Simple Action
 */
export function buildSimpleActionSteps(options: BuildSimpleActionStepsOptions): TransactionStepsResult {
  const { formData, safeAddress, guardAddress, proposeTransaction, proposePreApproval, approvalDurationSeconds } =
    options;

  const preApprovalDuration = approvalDurationSeconds ?? DEFAULT_PRE_APPROVAL_DURATION;
  const steps: TransactionStep[] = [];

  // Build array of simple actions from form data
  const simpleActions = formData.actions.map((action) => ({
    target: action.target as Address,
    signature: action.signature,
    data: (action.data || "0x") as Hex,
    value: action.value && action.value.trim() !== "" ? BigInt(action.value) : 0n,
  }));

  // 1. MANDATORY: Deploy Simple Actions
  const deployData = encodeFunctionData({
    abi: simpleActionFactoryAbi,
    functionName: "createSimpleActions",
    args: [simpleActions],
  });

  steps.push({
    id: "deploy-simple-action",
    title: "Deploy Simple Action",
    description: "Deploy the simple action builder contract",
    status: "pending",
    to: SIMPLE_ACTIONS_FACTORY,
    data: deployData,
  });

  // 2. MANDATORY: Record in Registry
  const recordData = encodeFunctionData({
    abi: canonGuardRegistryAbi,
    functionName: "record",
    args: [
      guardAddress,
      ["0x0000000000000000000000000000000000000000" as Address],
      [formData.title || "Untitled Simple Action"],
    ],
  });

  steps.push({
    id: "record-registry",
    title: "Save to Canon List",
    description: "Save the action for future use",
    status: "pending",
    to: CANON_GUARD_REGISTRY,
    data: recordData,
  });

  // 3. OPTIONAL: Propose Transaction (queue + sign)
  if (proposeTransaction) {
    const queueData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: ["0x0000000000000000000000000000000000000000" as Address],
    });

    steps.push({
      id: "queue-action",
      title: "Queue Transaction",
      description: "Add the transaction to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queueData,
    });

    const approveHashData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
    });

    steps.push({
      id: "sign-safe-tx",
      title: "Sign Transaction",
      description: "Sign the transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: approveHashData,
    });
  }

  // 4. OPTIONAL: Propose Pre-Approval
  if (proposePreApproval) {
    const deployPreApproveData = encodeFunctionData({
      abi: preApproveActionFactoryAbi,
      functionName: "createPreApproveAction",
      args: ["0x0000000000000000000000000000000000000000" as Address, preApprovalDuration],
    });

    steps.push({
      id: "deploy-preapprove",
      title: "Deploy Pre-Approval",
      description: "Deploy the pre-approval action contract",
      status: "pending",
      to: PRE_APPROVE_ACTION_FACTORY,
      data: deployPreApproveData,
    });

    const queuePreApproveData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: ["0x0000000000000000000000000000000000000000" as Address],
    });

    steps.push({
      id: "queue-preapprove",
      title: "Queue Pre-Approval",
      description: "Add the pre-approval to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queuePreApproveData,
    });

    const signPreApproveData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
    });

    steps.push({
      id: "sign-preapprove",
      title: "Sign Pre-Approval",
      description: "Sign the pre-approval transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: signPreApproveData,
    });
  }

  return { steps };
}

// Options for building Claim Allowance transaction steps
export interface BuildClaimAllowanceStepsOptions {
  formData: ClaimAllowanceFormData;
  safeAddress: Address;
  guardAddress: Address;
  proposeTransaction: boolean;
  proposePreApproval: boolean;
  approvalDurationSeconds?: bigint;
}

/**
 * Builds the list of transaction steps for Claim Allowance
 */
export function buildClaimAllowanceSteps(options: BuildClaimAllowanceStepsOptions): TransactionStepsResult {
  const { formData, safeAddress, guardAddress, proposeTransaction, proposePreApproval, approvalDurationSeconds } =
    options;

  const preApprovalDuration = approvalDurationSeconds ?? DEFAULT_PRE_APPROVAL_DURATION;
  const steps: TransactionStep[] = [];

  // 1. MANDATORY: Deploy Claim Allowance
  const deployData = encodeFunctionData({
    abi: allowanceClaimorFactoryAbi,
    functionName: "createAllowanceClaimor",
    args: [formData.token as Address, formData.tokenOwner as Address, formData.tokenRecipient as Address],
  });

  steps.push({
    id: "deploy-claim-allowance",
    title: "Deploy Claim Allowance",
    description: "Deploy the allowance claimor action builder contract",
    status: "pending",
    to: ALLOWANCE_CLAIMOR_FACTORY,
    data: deployData,
  });

  // 2. MANDATORY: Record in Registry
  const recordData = encodeFunctionData({
    abi: canonGuardRegistryAbi,
    functionName: "record",
    args: [
      guardAddress,
      ["0x0000000000000000000000000000000000000000" as Address],
      [formData.title || "Untitled Claim Allowance"],
    ],
  });

  steps.push({
    id: "record-registry",
    title: "Save to Canon List",
    description: "Save the action for future use",
    status: "pending",
    to: CANON_GUARD_REGISTRY,
    data: recordData,
  });

  // 3. OPTIONAL: Propose Transaction (queue + sign)
  if (proposeTransaction) {
    const queueData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: ["0x0000000000000000000000000000000000000000" as Address],
    });

    steps.push({
      id: "queue-action",
      title: "Queue Transaction",
      description: "Add the transaction to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queueData,
    });

    const approveHashData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
    });

    steps.push({
      id: "sign-safe-tx",
      title: "Sign Transaction",
      description: "Sign the transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: approveHashData,
    });
  }

  // 4. OPTIONAL: Propose Pre-Approval
  if (proposePreApproval) {
    const deployPreApproveData = encodeFunctionData({
      abi: preApproveActionFactoryAbi,
      functionName: "createPreApproveAction",
      args: ["0x0000000000000000000000000000000000000000" as Address, preApprovalDuration],
    });

    steps.push({
      id: "deploy-preapprove",
      title: "Deploy Pre-Approval",
      description: "Deploy the pre-approval action contract",
      status: "pending",
      to: PRE_APPROVE_ACTION_FACTORY,
      data: deployPreApproveData,
    });

    const queuePreApproveData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: ["0x0000000000000000000000000000000000000000" as Address],
    });

    steps.push({
      id: "queue-preapprove",
      title: "Queue Pre-Approval",
      description: "Add the pre-approval to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queuePreApproveData,
    });

    const signPreApproveData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
    });

    steps.push({
      id: "sign-preapprove",
      title: "Sign Pre-Approval",
      description: "Sign the pre-approval transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: signPreApproveData,
    });
  }

  return { steps };
}

// Options for building Capped Transfer Hub transaction steps
export interface BuildCappedTransferHubStepsOptions {
  formData: CappedTransferHubFormData;
  safeAddress: Address;
  guardAddress: Address;
  proposePreApproval: boolean;
  approvalDurationSeconds?: bigint;
}

/**
 * Builds the list of transaction steps for Capped Token Transfers Hub
 */
export function buildCappedTransferHubSteps(options: BuildCappedTransferHubStepsOptions): TransactionStepsResult {
  const { formData, safeAddress, guardAddress, proposePreApproval, approvalDurationSeconds } = options;

  const preApprovalDuration = approvalDurationSeconds ?? DEFAULT_PRE_APPROVAL_DURATION;
  const steps: TransactionStep[] = [];

  // Calculate epoch length in seconds
  const epochLengthValue = parseFloat(formData.epochLength) || 0;
  const epochLengthSeconds = BigInt(Math.floor(epochLengthValue * EPOCH_TIME_MULTIPLIERS[formData.epochUnit]));

  // Prepare tokens and caps arrays
  // Note: Caps are parsed with 18 decimals - this should be enhanced to detect token decimals
  const tokens: Address[] = formData.tokens.map((t) => t.address as Address);
  const caps: bigint[] = formData.tokens.map((t) => parseUnits(t.amount || "0", 18));

  // 1. MANDATORY: Deploy Capped Token Transfers Hub
  const deployData = encodeFunctionData({
    abi: cappedTokenTransfersHubFactoryAbi,
    functionName: "createCappedTokenTransfersHub",
    args: [
      safeAddress, // _safe
      formData.recipientAddress as Address, // _recipient
      tokens, // _tokens
      caps, // _caps
      epochLengthSeconds, // _epochLength
    ],
  });

  steps.push({
    id: "deploy-capped-transfer-hub",
    title: "Deploy Hub",
    description: "Deploy the Capped Token Transfers Hub contract",
    status: "pending",
    to: CAPPED_TOKEN_TRANSFERS_HUB_FACTORY,
    data: deployData,
  });

  // 2. MANDATORY: Record in Registry
  const recordData = encodeFunctionData({
    abi: canonGuardRegistryAbi,
    functionName: "record",
    args: [guardAddress, ["0x0000000000000000000000000000000000000000" as Address], [formData.title || "Untitled Hub"]],
  });

  steps.push({
    id: "record-registry",
    title: "Save to Canon List",
    description: "Save the hub for future use",
    status: "pending",
    to: CANON_GUARD_REGISTRY,
    data: recordData,
  });

  // 3. OPTIONAL: Propose Pre-Approval
  if (proposePreApproval) {
    const deployPreApproveData = encodeFunctionData({
      abi: preApproveActionFactoryAbi,
      functionName: "createPreApproveAction",
      args: ["0x0000000000000000000000000000000000000000" as Address, preApprovalDuration],
    });

    steps.push({
      id: "deploy-preapprove",
      title: "Deploy Pre-Approval",
      description: "Deploy the pre-approval action contract",
      status: "pending",
      to: PRE_APPROVE_ACTION_FACTORY,
      data: deployPreApproveData,
    });

    const queuePreApproveData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: ["0x0000000000000000000000000000000000000000" as Address],
    });

    steps.push({
      id: "queue-preapprove",
      title: "Queue Pre-Approval",
      description: "Add the pre-approval to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queuePreApproveData,
    });

    const signPreApproveData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
    });

    steps.push({
      id: "sign-preapprove",
      title: "Sign Pre-Approval",
      description: "Sign the pre-approval transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: signPreApproveData,
    });
  }

  return { steps };
}

// Options for building Hub Child deployment steps
export interface BuildDeployHubChildStepsOptions {
  formData: HubChildFormData;
  hubAddress: Address;
  safeAddress: Address;
  guardAddress: Address;
  proposeTransaction: boolean;
}

/**
 * Builds the list of transaction steps for deploying a Hub Child (CappedTokenTransfers)
 */
export function buildDeployHubChildSteps(options: BuildDeployHubChildStepsOptions): TransactionStepsResult {
  const { formData, hubAddress, safeAddress, guardAddress, proposeTransaction } = options;

  const steps: TransactionStep[] = [];

  // Parse amount - assuming 18 decimals for now
  const amount = parseUnits(formData.amount || "0", 18);

  // 1. MANDATORY: Deploy Hub Child via createNewActionsBuilder on the hub
  const deployData = encodeFunctionData({
    abi: cappedTokenTransfersHubAbi,
    functionName: "createNewActionsBuilder",
    args: [formData.token as Address, amount],
  });

  steps.push({
    id: "deploy-hub-child",
    title: "Deploy Child Action",
    description: "Deploy the capped transfer action via the hub",
    status: "pending",
    to: hubAddress,
    data: deployData,
  });

  // 2. MANDATORY: Record in Registry
  const recordData = encodeFunctionData({
    abi: canonGuardRegistryAbi,
    functionName: "record",
    args: [
      guardAddress,
      ["0x0000000000000000000000000000000000000000" as Address],
      [formData.title || "Untitled Transfer"],
    ],
  });

  steps.push({
    id: "record-registry",
    title: "Save to Canon List",
    description: "Save the action for future use",
    status: "pending",
    to: CANON_GUARD_REGISTRY,
    data: recordData,
  });

  // 3. OPTIONAL: Propose Transaction (queue + sign)
  if (proposeTransaction) {
    const queueData = encodeFunctionData({
      abi: canonGuardEntrypointAbi,
      functionName: "queueTransaction",
      args: ["0x0000000000000000000000000000000000000000" as Address],
    });

    steps.push({
      id: "queue-action",
      title: "Queue Transaction",
      description: "Add the transaction to the Canon Guard queue",
      status: "pending",
      to: guardAddress,
      data: queueData,
    });

    const approveHashData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
    });

    steps.push({
      id: "sign-safe-tx",
      title: "Sign Transaction",
      description: "Sign the transaction in your Safe wallet",
      status: "pending",
      to: safeAddress,
      data: approveHashData,
    });
  }

  return { steps };
}

/**
 * Get human-readable summary of transaction steps
 */
export function getTransactionSummary(steps: TransactionStep[]): string {
  const signed = steps.filter((s) => s.status === "signed").length;
  const total = steps.length;
  return `${signed}/${total} transactions signed`;
}
