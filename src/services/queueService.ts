/**
 * Queue Service - Fetches and processes queued transactions from Canon Guard
 *
 * Responsibilities:
 * - Fetch queued action builders from Canon Guard
 * - Scan nonces (currentNonce to currentNonce + queueSize + buffer) to find approvals
 * - Create queue items for each action builder with their actual signed nonce
 * - Determine factory types and fetch labels from registry
 */

import { Address, Hash, Hex, PublicClient } from "viem";
import {
  canonGuardAbi,
  safeAbi,
  canonGuardRegistryAbi,
  actionBuilderParentAbi,
  preApproveActionAbi,
} from "../abis/canonGuard";
import { CANON_GUARD_REGISTRY, KNOWN_FACTORY_MAPPINGS } from "../constants/canonGuard";
import { ActionFactoryType } from "../types";
import { ClientService } from "./clientService";

// Number of extra nonces to scan beyond queue size
const NONCE_SCAN_BUFFER = 10;

// Pre-deployed UnsetEmergencyModeAction contract - has a hardcoded label
const UNSET_EMERGENCY_MODE_ACTION: Address = "0x68e54338e31C7A8B7c46a2BB8Fd73f3a0606A506";

/**
 * Represents a queue item - an action builder at a specific nonce with approvals
 */
export interface QueueItem {
  actionBuilderAddress: Address;
  nonce: number;
  currentNonce: number;
  isAtCurrentNonce: boolean;

  // Transaction info
  proposer: Address;
  actionsData: Hex;
  executableAt: Date;
  expiresAt: Date;
  isPreApproved: boolean;

  // Approval info
  safeTxHash: Hash;
  approvers: Address[];
  approversCount: number;
  threshold: number;

  // Factory info
  factoryType: ActionFactoryType;
  factoryLabel: string;

  // Label from registry (if available)
  label: string;

  // Computed state
  isFullySigned: boolean;
  isExecutable: boolean;
  isExpired: boolean;
  hasExecutionDelay: boolean;
  executionDelayRemaining: number; // seconds remaining
}

export class QueueService {
  private clientService: ClientService;

  constructor(clientService: ClientService) {
    this.clientService = clientService;
  }

  private get client(): PublicClient {
    return this.clientService.getClient();
  }

  /**
   * Fetch all queue items with forward nonce scanning
   * Scans from currentNonce to currentNonce + queueSize + NONCE_SCAN_BUFFER
   * to find signatures at any nonce
   */
  async getQueueItems(guardAddress: Address, safeAddress: Address): Promise<QueueItem[]> {
    // Step 1: Get queued action builders
    const actionBuilders = await this.getQueuedActionBuilders(guardAddress);
    if (actionBuilders.length === 0) return [];

    // Step 2: Get current Safe nonce and threshold
    const [currentNonce, threshold] = await Promise.all([
      this.getSafeNonce(guardAddress),
      this.getSafeThreshold(safeAddress),
    ]);

    // Step 3: Calculate nonce scan range (forward scanning)
    // Scan from currentNonce to currentNonce + queueSize + buffer
    const endNonce = currentNonce + actionBuilders.length + NONCE_SCAN_BUFFER;

    console.log(
      `[QueueService] Scanning nonces from ${currentNonce} to ${endNonce} for ${actionBuilders.length} action builders`,
    );

    // Step 4: Batch fetch all data in parallel
    const [transactionInfoMap, factoryTypeMap, approvalsByActionAndNonce] = await Promise.all([
      this.batchFetchTransactionInfo(guardAddress, actionBuilders),
      this.batchFetchFactoryTypes(actionBuilders),
      this.batchScanAllNonces(guardAddress, actionBuilders, currentNonce, endNonce),
    ]);

    // Step 5: Identify pre-approve actions and fetch labels
    const preApproveActions = actionBuilders.filter(
      (addr) => factoryTypeMap.get(addr)?.type === ActionFactoryType.APPROVE_ACTION,
    );
    const regularActions = actionBuilders.filter(
      (addr) => factoryTypeMap.get(addr)?.type !== ActionFactoryType.APPROVE_ACTION,
    );

    const underlyingActionMap = await this.batchFetchUnderlyingActions(preApproveActions);
    const underlyingAddresses = Array.from(underlyingActionMap.values());
    const allAddressesToFetchLabels = [...regularActions, ...underlyingAddresses];
    const labelsMap = await this.batchFetchLabels(guardAddress, allAddressesToFetchLabels);

    // Step 6: Pre-compute best nonces for all action builders
    const bestNonceMap = new Map<Address, { bestNonce: number; approvers: Address[] }>();
    for (const actionBuilder of actionBuilders) {
      const approvalsByNonce = approvalsByActionAndNonce.get(actionBuilder) || new Map();
      bestNonceMap.set(actionBuilder, this.findBestNonce(approvalsByNonce, currentNonce));
    }

    // Step 7: Batch fetch all safeTxHashes in a single multicall
    const safeTxHashMap = await this.batchFetchSafeTxHashes(guardAddress, actionBuilders, bestNonceMap);

    // Step 8: Build queue items
    const queueItems: QueueItem[] = [];
    const now = Date.now();

    for (const actionBuilder of actionBuilders) {
      const txInfo = transactionInfoMap.get(actionBuilder);
      if (!txInfo) continue;

      // Get factory info
      const isEmergencyModeAction = actionBuilder.toLowerCase() === UNSET_EMERGENCY_MODE_ACTION.toLowerCase();
      const factoryInfo = isEmergencyModeAction
        ? { type: ActionFactoryType.UNKNOWN, label: "Emergency" }
        : factoryTypeMap.get(actionBuilder) || {
            type: ActionFactoryType.UNKNOWN,
            label: "Unknown",
          };

      // Build label
      let label: string;
      if (isEmergencyModeAction) {
        label = "Turn Off Emergency Mode";
      } else if (factoryInfo.type === ActionFactoryType.APPROVE_ACTION) {
        const underlyingAction = underlyingActionMap.get(actionBuilder);
        const underlyingLabel = underlyingAction ? labelsMap.get(underlyingAction) : "";
        label = `Pre-Approval | ${underlyingLabel || "Untitled Transaction"}`;
      } else {
        label = labelsMap.get(actionBuilder) || "";
      }

      // Get pre-computed best nonce and safeTxHash
      const { bestNonce, approvers } = bestNonceMap.get(actionBuilder) || { bestNonce: currentNonce, approvers: [] };
      const safeTxHash =
        safeTxHashMap.get(actionBuilder) ||
        ("0x0000000000000000000000000000000000000000000000000000000000000000" as Hash);

      console.log(
        `[QueueService] Action builder ${actionBuilder}: ${JSON.stringify({
          label,
          currentNonce,
          bestNonce,
          approversCount: approvers.length,
        })}`,
      );
      const executableAtMs = Number(txInfo.executableAt) * 1000;
      const expiresAtMs = Number(txInfo.expiresAt) * 1000;

      const isFullySigned = approvers.length >= threshold;
      const isExpired = expiresAtMs < now;
      const hasExecutionDelay = executableAtMs > now;
      const executionDelayRemaining = Math.max(0, Math.floor((executableAtMs - now) / 1000));

      // Executable only if: fully signed, not expired, delay passed, AND at current nonce
      const isExecutable = isFullySigned && !isExpired && !hasExecutionDelay && bestNonce === currentNonce;

      const queueItem: QueueItem = {
        actionBuilderAddress: actionBuilder,
        nonce: bestNonce,
        currentNonce,
        isAtCurrentNonce: bestNonce === currentNonce,
        proposer: txInfo.proposer,
        actionsData: txInfo.actionsData,
        executableAt: new Date(executableAtMs),
        expiresAt: new Date(expiresAtMs),
        isPreApproved: txInfo.isPreApproved,
        safeTxHash,
        approvers,
        approversCount: approvers.length,
        threshold,
        factoryType: factoryInfo.type,
        factoryLabel: factoryInfo.label,
        label,
        isFullySigned,
        isExecutable,
        isExpired,
        hasExecutionDelay,
        executionDelayRemaining,
      };

      console.log(
        `[QueueService] Adding queue item: ${JSON.stringify({
          label,
          nonce: bestNonce,
          approversCount: approvers.length,
          threshold,
          isFullySigned,
          isAtCurrentNonce: bestNonce === currentNonce,
        })}`,
      );

      queueItems.push(queueItem);
    }

    // Sort: items needing signatures first (warning state), then by label
    return queueItems.sort((a, b) => {
      const aIsWarning = a.approversCount === 0;
      const bIsWarning = b.approversCount === 0;
      if (aIsWarning && !bIsWarning) return -1;
      if (!aIsWarning && bIsWarning) return 1;
      return (a.label || "").localeCompare(b.label || "");
    });
  }

  /**
   * Find the best nonce for an action builder
   * - If no signatures found → return currentNonce with empty approvers (unsigned state)
   * - If signatures found → return nonce with most signatures (earliest nonce as tiebreaker)
   */
  private findBestNonce(
    approvalsByNonce: Map<number, Address[]>,
    currentNonce: number,
  ): { bestNonce: number; approvers: Address[] } {
    let bestNonce = currentNonce;
    let bestApprovers: Address[] = [];
    let maxSignatures = 0;

    for (const [nonce, approvers] of approvalsByNonce) {
      if (approvers.length > maxSignatures) {
        maxSignatures = approvers.length;
        bestNonce = nonce;
        bestApprovers = approvers;
      } else if (approvers.length === maxSignatures && approvers.length > 0 && nonce < bestNonce) {
        // Same number of signatures, prefer earlier nonce
        bestNonce = nonce;
        bestApprovers = approvers;
      }
    }

    return { bestNonce, approvers: bestApprovers };
  }

  /**
   * Batch scan all nonces for all action builders in a single multicall
   * Returns Map<actionBuilder, Map<nonce, approvers[]>>
   */
  private async batchScanAllNonces(
    guardAddress: Address,
    actionBuilders: Address[],
    startNonce: number,
    endNonce: number,
  ): Promise<Map<Address, Map<number, Address[]>>> {
    const result = new Map<Address, Map<number, Address[]>>();

    // Initialize result map
    for (const actionBuilder of actionBuilders) {
      result.set(actionBuilder, new Map());
    }

    if (actionBuilders.length === 0) return result;

    // Build all nonces to scan
    const nonces: number[] = [];
    for (let nonce = startNonce; nonce <= endNonce; nonce++) {
      nonces.push(nonce);
    }

    // Build single multicall for ALL action builders x ALL nonces
    const contracts: {
      address: Address;
      abi: typeof canonGuardAbi;
      functionName: "getApprovedHashSigners";
      args: [Address, bigint];
    }[] = [];

    // Track which index corresponds to which (actionBuilder, nonce) pair
    const indexMap: { actionBuilder: Address; nonce: number }[] = [];

    for (const actionBuilder of actionBuilders) {
      for (const nonce of nonces) {
        contracts.push({
          address: guardAddress,
          abi: canonGuardAbi,
          functionName: "getApprovedHashSigners",
          args: [actionBuilder, BigInt(nonce)],
        });
        indexMap.push({ actionBuilder, nonce });
      }
    }

    console.log(
      `[QueueService] Executing batch multicall for ${contracts.length} calls (${actionBuilders.length} actions x ${nonces.length} nonces)`,
    );

    try {
      const results = await this.client.multicall({ contracts });

      for (let i = 0; i < results.length; i++) {
        const { actionBuilder, nonce } = indexMap[i];
        const callResult = results[i];

        const actionMap = result.get(actionBuilder)!;

        if (callResult.status === "success" && callResult.result) {
          const approvers = callResult.result as Address[];
          actionMap.set(nonce, approvers);

          // Log non-empty approvers for debugging
          if (approvers.length > 0) {
            console.log(`[QueueService] Found ${approvers.length} approvers for ${actionBuilder} at nonce ${nonce}`);
          }
        } else {
          actionMap.set(nonce, []);
        }
      }
    } catch (error) {
      console.error("[QueueService] Failed to batch scan nonces:", error);
    }

    return result;
  }

  /**
   * Get count of items in queue (for navbar)
   */
  async getQueueCount(guardAddress: Address): Promise<number> {
    const actionBuilders = await this.getQueuedActionBuilders(guardAddress);
    return actionBuilders.length;
  }

  private async getQueuedActionBuilders(guardAddress: Address): Promise<Address[]> {
    try {
      const result = await this.client.readContract({
        address: guardAddress,
        abi: canonGuardAbi,
        functionName: "getQueuedActionBuilders",
      });
      return (result as Address[]) || [];
    } catch (error) {
      console.error("Failed to fetch queued action builders:", error);
      return [];
    }
  }

  private async getSafeNonce(guardAddress: Address): Promise<number> {
    try {
      console.log("[QueueService] Fetching Safe nonce from guard:", guardAddress);
      const result = await this.client.readContract({
        address: guardAddress,
        abi: canonGuardAbi,
        functionName: "getSafeNonce",
      });
      const nonce = Number(result);
      console.log("[QueueService] Safe nonce fetched:", nonce);
      return nonce;
    } catch (error) {
      console.error("[QueueService] Failed to fetch Safe nonce:", error);
      return 0;
    }
  }

  private async getSafeThreshold(safeAddress: Address): Promise<number> {
    try {
      const result = await this.client.readContract({
        address: safeAddress,
        abi: safeAbi,
        functionName: "getThreshold",
      });
      return Number(result);
    } catch (error) {
      console.error("Failed to fetch Safe threshold:", error);
      return 1;
    }
  }

  private async batchFetchTransactionInfo(
    guardAddress: Address,
    actionBuilders: Address[],
  ): Promise<
    Map<
      Address,
      {
        proposer: Address;
        actionsData: Hex;
        executableAt: bigint;
        expiresAt: bigint;
        isPreApproved: boolean;
      }
    >
  > {
    const map = new Map<
      Address,
      {
        proposer: Address;
        actionsData: Hex;
        executableAt: bigint;
        expiresAt: bigint;
        isPreApproved: boolean;
      }
    >();

    if (actionBuilders.length === 0) return map;

    const contracts = actionBuilders.map((address) => ({
      address: guardAddress,
      abi: canonGuardAbi,
      functionName: "transactionsInfo" as const,
      args: [address],
    }));

    try {
      const results = await this.client.multicall({ contracts });

      for (let i = 0; i < actionBuilders.length; i++) {
        const result = results[i];
        if (result.status === "success" && result.result) {
          const [proposer, actionsData, executableAt, expiresAt, isPreApproved] = result.result as [
            Address,
            Hex,
            bigint,
            bigint,
            boolean,
          ];
          map.set(actionBuilders[i], {
            proposer,
            actionsData,
            executableAt,
            expiresAt,
            isPreApproved,
          });
        }
      }
    } catch (error) {
      console.error("Failed to batch fetch transaction info:", error);
    }

    return map;
  }

  private async batchFetchFactoryTypes(
    actionBuilders: Address[],
  ): Promise<Map<Address, { type: ActionFactoryType; label: string }>> {
    const map = new Map<Address, { type: ActionFactoryType; label: string }>();

    if (actionBuilders.length === 0) return map;

    // First check known factory mappings (action builder might be a factory)
    for (const address of actionBuilders) {
      if (KNOWN_FACTORY_MAPPINGS[address]) {
        map.set(address, KNOWN_FACTORY_MAPPINGS[address]);
      }
    }

    // For unknown ones, call PARENT() to get factory address
    const unknownBuilders = actionBuilders.filter((addr) => !map.has(addr));

    if (unknownBuilders.length === 0) return map;

    const contracts = unknownBuilders.map((address) => ({
      address,
      abi: actionBuilderParentAbi,
      functionName: "PARENT" as const,
    }));

    try {
      const results = await this.client.multicall({ contracts });

      for (let i = 0; i < unknownBuilders.length; i++) {
        const result = results[i];
        if (result.status === "success" && result.result) {
          const parentFactory = result.result as Address;
          const factoryMapping = KNOWN_FACTORY_MAPPINGS[parentFactory];
          if (factoryMapping) {
            map.set(unknownBuilders[i], factoryMapping);
          } else {
            map.set(unknownBuilders[i], {
              type: ActionFactoryType.UNKNOWN,
              label: "Unknown",
            });
          }
        } else {
          map.set(unknownBuilders[i], {
            type: ActionFactoryType.UNKNOWN,
            label: "Unknown",
          });
        }
      }
    } catch (error) {
      console.error("Failed to batch fetch factory types:", error);
    }

    return map;
  }

  private async batchFetchLabels(guardAddress: Address, actionBuilders: Address[]): Promise<Map<Address, string>> {
    const map = new Map<Address, string>();

    if (actionBuilders.length === 0) return map;

    const contracts = actionBuilders.map((address) => ({
      address: CANON_GUARD_REGISTRY,
      abi: canonGuardRegistryAbi,
      functionName: "entityLabel" as const,
      args: [guardAddress, address],
    }));

    try {
      const results = await this.client.multicall({ contracts });

      for (let i = 0; i < actionBuilders.length; i++) {
        const result = results[i];
        if (result.status === "success" && result.result) {
          const edition = result.result as { label: string; lastEditedAt: bigint };
          map.set(actionBuilders[i], edition.label || "");
        }
      }
    } catch (error) {
      console.error("Failed to batch fetch labels:", error);
    }

    return map;
  }

  /**
   * For pre-approve actions, fetch the underlying action builder address
   * by calling ACTIONS_BUILDER() on each pre-approve action contract
   */
  private async batchFetchUnderlyingActions(preApproveActions: Address[]): Promise<Map<Address, Address>> {
    const map = new Map<Address, Address>();

    if (preApproveActions.length === 0) return map;

    const contracts = preApproveActions.map((address) => ({
      address,
      abi: preApproveActionAbi,
      functionName: "ACTIONS_BUILDER" as const,
    }));

    try {
      const results = await this.client.multicall({ contracts });

      for (let i = 0; i < preApproveActions.length; i++) {
        const result = results[i];
        if (result.status === "success" && result.result) {
          const underlyingAction = result.result as Address;
          map.set(preApproveActions[i], underlyingAction);
        }
      }
    } catch (error) {
      console.error("Failed to batch fetch underlying actions:", error);
    }

    return map;
  }

  /**
   * Batch fetch safeTxHashes for all action builders at their best nonces
   * in a single multicall
   */
  private async batchFetchSafeTxHashes(
    guardAddress: Address,
    actionBuilders: Address[],
    bestNonceMap: Map<Address, { bestNonce: number; approvers: Address[] }>,
  ): Promise<Map<Address, Hash>> {
    const map = new Map<Address, Hash>();

    if (actionBuilders.length === 0) return map;

    const contracts = actionBuilders.map((actionBuilder) => {
      const { bestNonce } = bestNonceMap.get(actionBuilder) || { bestNonce: 0 };
      return {
        address: guardAddress,
        abi: canonGuardAbi,
        functionName: "getSafeTransactionHash" as const,
        args: [actionBuilder, BigInt(bestNonce)],
      };
    });

    try {
      const results = await this.client.multicall({ contracts });

      for (let i = 0; i < actionBuilders.length; i++) {
        const result = results[i];
        if (result.status === "success" && result.result) {
          map.set(actionBuilders[i], result.result as Hash);
        } else {
          map.set(actionBuilders[i], "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash);
        }
      }
    } catch (error) {
      console.error("Failed to batch fetch safeTxHashes:", error);
    }

    return map;
  }

  /**
   * Get the current Safe nonce (public method for external use)
   * This is useful for nonce selection in signing flows
   */
  async getCurrentSafeNonce(guardAddress: Address): Promise<number> {
    return this.getSafeNonce(guardAddress);
  }
}
