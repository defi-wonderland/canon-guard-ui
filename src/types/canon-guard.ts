import { Address, Hash, Hex } from "viem";

// ================================================================
// CANON GUARD CORE TYPES
// ================================================================

/**
 * Represents the lifecycle state of a queued transaction
 */
export enum QueuedTransactionState {
  QUEUED = "queued",
  EXECUTABLE = "executable",
  EXPIRED = "expired",
  EXECUTED = "executed",
}

/**
 * Types of action factories available in the Canon Guard system
 */
export enum ActionFactoryType {
  SIMPLE_ACTIONS = "simple_actions",
  SIMPLE_TRANSFERS = "simple_transfers",
  CAPPED_TOKEN_TRANSFERS = "capped_token_transfers",
  ALLOWANCE_CLAIMOR = "allowance_claimor",
  APPROVE_ACTION = "approve_action",
}

/**
 * Types of pre-approved items (action builders or hubs)
 */
export enum PreApprovedItemType {
  BUILDER = "builder",
  HUB = "hub",
}

/**
 * Canon Guard registry containing all factory addresses
 */
export interface CanonRegistry {
  safeEntrypointFactory: Address;
  allowanceClaimorFactory: Address;
  approveActionFactory: Address;
  cappedTokenTransfersHubFactory: Address;
  simpleActionsFactory: Address;
  simpleTransfersFactory: Address;
}

// ================================================================
// ACTION BUILDER & HUB TYPES
// ================================================================

/**
 * Base interface for action builders - contracts that encode specific operations
 */
export interface ActionBuilder {
  address: Address;
  factoryType: ActionFactoryType;
  factoryAddress: Address;
  createdAt: Date;
  isApproved: boolean;
  approvalExpiresAt?: Date;
  hub?: ActionHub; // Optional parent hub
}

/**
 * Action hubs group related actions with shared approval patterns
 */
export interface ActionHub {
  address: Address;
  factoryAddress: Address;
  type: ActionFactoryType;
  isApproved: boolean;
  approvalExpiresAt?: Date;
  childActions: ActionBuilder[];
}

/**
 * Represents a queued transaction in the Canon Guard system
 */
export interface QueuedTransaction {
  actionBuilder: ActionBuilder;
  actionHub?: ActionHub;
  state: QueuedTransactionState;
  queuedAt: Date;
  executableAt: Date;
  expiresAt: Date;
  safeTxHash: Address;
  approversCount: number;
  requiredApprovals: number;
  approvers: Address[]; // Array of owner addresses who approved
}

/**
 * Pre-approved action builder or hub
 */
export interface PreApprovedItem {
  address: Address;
  type: PreApprovedItemType;
  factoryType?: ActionFactoryType;
  approvedAt: Date;
  expiresAt: Date;
  approvalDuration: number; // in seconds
}

// ================================================================
// VAULT & CONFIGURATION TYPES
// ================================================================

/**
 * Canon Guard configuration for a specific vault
 */
export interface CanonGuardConfiguration {
  vaultAddress: string;
  entrypointAddress: string;
  shortTxExecutionDelay: number; // in seconds
  longTxExecutionDelay: number; // in seconds
  txExpiryDelay: number; // in seconds
  maxApprovalDuration: number; // in seconds
  emergencyTriggerAddress: string;
  emergencyCallerAddress: string;
  isEmergencyMode: boolean;
}

/**
 * Information about a Safe vault with Canon Guard
 */
export interface VaultInfo {
  address: string;
  chainId: number;
  network: string;
  threshold: number;
  owners: string[];
  totalOwners: number;
  hasCanonGuard: boolean;
  guardAddress?: string;
  nonce: number;
}

/**
 * Complete vault data including configuration and actions
 */
export interface VaultData {
  vaultInfo: VaultInfo;
  configuration?: CanonGuardConfiguration;
  queuedTransactions: QueuedTransaction[];
  preApprovedItems: PreApprovedItem[];
  executionHistory: ExecutedTransaction[];
}

// ================================================================
// TRANSACTION & EXECUTION TYPES
// ================================================================

/**
 * Details about an executed transaction
 */
export interface ExecutedTransaction {
  actionBuilder: ActionBuilder;
  actionHub?: ActionHub;
  safeTxHash: Hash;
  executedAt: Date;
  executedBy: Address;
  approvers: Address[];
  gasUsed?: number;
  txHash: Hash;
}

/**
 * Action details for display and execution
 */
export interface ActionDetails {
  actionBuilder: Address;
  target: Address;
  value: string; // in wei
  calldata: Hex;
  fnSignature?: string; // Function signature like "approve(address,uint256)"
  decodedParams?: Record<string, unknown>;
}

/**
 * Simple action structure for building new actions
 */
export interface SimpleAction {
  target: Address;
  fnSignature: string; // Function signature like "transfer(address,uint256)"
  data: Hex; // ABI-encoded parameters
  value: string; // in wei
}

/**
 * Token transfer action structure
 */
export interface TransferAction {
  token: Address;
  to: Address;
  amount: string; // in token units
}

// ================================================================
// UI STATE TYPES
// ================================================================

/**
 * UI tab types for navigation
 */
export enum TabType {
  QUEUE = "queue",
  PRE_APPROVED = "pre-approved",
  HISTORY = "history",
  CONFIGURATION = "configuration",
  ACTIONS = "actions",
}

/**
 * Action creation wizard steps
 */
export enum ActionWizardStep {
  SELECT_TYPE = "select-type",
  CONFIGURE_ACTION = "configure-action",
  REVIEW = "review",
  DEPLOY = "deploy",
  QUEUE = "queue",
}

/**
 * Filter options for transaction lists
 */
export interface TransactionFilters {
  state?: QueuedTransactionState[];
  factoryType?: ActionFactoryType[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  hasHub?: boolean;
}
