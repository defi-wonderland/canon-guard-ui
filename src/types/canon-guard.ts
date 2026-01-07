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
  SAFE_ENTRYPOINT = "safe_entrypoint",
  SIMPLE_ACTIONS = "simple_actions",
  SIMPLE_TRANSFERS = "simple_transfers",
  CAPPED_TOKEN_TRANSFERS = "capped_token_transfers",
  ALLOWANCE_CLAIMOR = "allowance_claimor",
  APPROVE_ACTION = "approve_action",
  CHANGE_SAFE_GUARD = "change_safe_guard",
  SET_EMERGENCY_CALLER = "set_emergency_caller",
  SET_EMERGENCY_TRIGGER = "set_emergency_trigger",
  EVERCLEAR_TOKEN_CONVERSION = "everclear_token_conversion",
  OPX_ACTION = "opx_action",
  UNKNOWN = "unknown",
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
  actionBuilderAddress: Address;
  factoryLabel: string;
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
  actionBuilderAddress: Address;
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
 * Pre-approved action builder or hub -  represents Safe transactions waiting for approval
 */
export interface PreApprovedItem {
  address: Address;
  type: PreApprovedItemType;
  factoryType?: ActionFactoryType;
  approvedAt: Date;
  expiresAt: Date;
  approvalDuration: number;

  // Safe transaction specific fields for "Waiting for Approval" column
  safeTxHash?: Hash;
  approversCount?: number;
  requiredApprovals?: number;
  approvers?: Address[];
}

// ================================================================
// VAULT & CONFIGURATION TYPES
// ================================================================

/**
 * Canon Guard configuration for a specific Safe
 */
export interface CanonGuardConfiguration {
  safeAddress: Address;
  entrypointAddress: Address;
  shortTxExecutionDelay: number;
  longTxExecutionDelay: number;
  txExpiryDelay: number;
  maxApprovalDuration: number;
  emergencyTriggerAddress: Address;
  emergencyCallerAddress: Address;
  isEmergencyMode: boolean;
}

export interface SafeInfo {
  address: Address;
  chainId: number;
  network: string;
  threshold: number;
  owners: Address[];
  totalOwners: number;
  /** Whether the Safe has any guard attached */
  hasGuard: boolean;
  /** Whether the attached guard is a valid Canon Guard (deployed from supported factory) */
  isValidCanonGuard: boolean;
  guardAddress?: Address;
  nonce: number;
}

export interface CanonGuardData {
  safeInfo: SafeInfo;
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
  value: bigint;
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
  value: bigint;
}

/**
 * Token transfer action structure
 */
export interface TransferAction {
  token: Address;
  to: Address;
  amount: bigint;
}

// ================================================================
// UI STATE TYPES
// ================================================================

/**
 * UI tab types for navigation (matches Figma header design)
 */
export enum TabType {
  QUEUE = "queue",
  CANON_LIST = "canon-list",
  CREATE = "create",
}

// ================================================================
// CANON GUARD UTILITIES TYPES
// ================================================================

/**
 * Canon Guard entrypoint configuration
 */
export interface EntrypointConfiguration {
  shortTxExecutionDelay: bigint;
  longTxExecutionDelay: bigint;
  txExpiryDelay: bigint;
  maxApprovalDuration: bigint;
}

/**
 * Transaction details from Canon Guard
 */
export interface TransactionDetails {
  actionsData: Hex;
  executableAt: bigint;
  expiresAt: bigint;
  safeTxHash: Hash;
  approvalExpiry: bigint;
}

/**
 * Batched transaction details with approvers
 */
export interface BatchedTransactionDetails {
  actionsData: Hex;
  executableAt: bigint;
  expiresAt: bigint;
  safeTxHash: Hash;
  approvalExpiry: bigint;
  approvers: Address[];
}

// ================================================================
// HUB TYPES
// ================================================================

/**
 * Types of hub factories available in the Canon Guard system
 */
export enum HubFactoryType {
  CAPPED_TOKEN_TRANSFERS_HUB = "capped_token_transfers_hub",
}

/**
 * Token configuration for a CappedTokenTransfersHub
 */
export interface HubTokenConfig {
  address: Address;
  cap: bigint;
  capLeft: bigint;
}

/**
 * Hub information for CappedTokenTransfersHub
 */
export interface CappedTokenTransfersHubInfo {
  address: Address;
  recipient: Address;
  epochLength: bigint;
  tokens: HubTokenConfig[];
}

/**
 * Information about a hub child entity in the Canon List
 */
export interface HubChildInfo {
  parentHubAddress: Address;
  token: Address;
  amount: bigint;
  recipient: Address;
}
