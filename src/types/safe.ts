export interface SafeAction {
  id: string;
  factoryAddress: string;
  factoryLabel?: string;
  isPreApproved: boolean;
  queuedAt: Date;
  timeRemainingToExecutable: number; // in milliseconds
  nonce?: number;
  approvalsCount?: number;
  approvalThreshold?: number;
  tenderlySim?: string;
}

export interface PreApprovedAction {
  id: string;
  isHub: boolean;
  address: string;
  approvedAt: Date;
  expiresAt: Date;
}

export interface SafeConfiguration {
  safeAddress: string;
  entrypointAddress: string;
  shortTransactionDelay: number; // in seconds
  longTransactionDelay: number; // in seconds
  transactionExpiryDelay: number; // in seconds
  maxApprovalDuration: number; // in seconds
  emergencyTriggerAddress: string;
  emergencyCallerAddress: string;
}

export interface SafeInfo {
  address: string;
  network: string;
  approvalThreshold: number;
  totalOwners: number;
  isValidCanonVault: boolean;
}

export interface SafeData {
  safeInfo: SafeInfo;
  configuration: SafeConfiguration;
  queuedActions: SafeAction[];
  waitingForApprovalActions: SafeAction[];
  preApprovedActions: PreApprovedAction[];
}

export interface QueuedAction extends SafeAction {
  actionHash: string;
  executionTime: Date;
}

export interface Approval extends SafeAction {
  actionHash: string;
  executionTime: Date;
}

export interface ActionDetails {
  actionHash: string;
  factoryAddress: string;
  calldata: string;
  value: string;
  target: string;
}

export enum TabType {
  QUEUE = "queue",
  PRE_APPROVED = "pre-approved",
  HISTORY = "history",
  CONFIGURATION = "configuration",
}
