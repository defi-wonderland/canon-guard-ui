/**
 * Canon Guard Service - Handles all Canon Guard entrypoint contract operations
 *
 * Responsibilities:
 * - Fetch queued transactions
 * - Classify actions by factory type and determine transaction states
 * - Aggregate complete Canon Vault data with execution history
 */

import { Address, PublicClient, Hash, Hex } from "viem";
import { canonGuardEntrypointAbi, actionBuilderAbi } from "../abis";
import {
  getFactoryType,
  getFactoryLabel,
  getFactoryLabelByType,
  KNOWN_FACTORY_MAPPINGS,
} from "../constants/canonGuard";
import {
  QueuedTransaction,
  PreApprovedItem,
  CanonVaultData,
  QueuedTransactionState,
  PreApprovedItemType,
  ActionFactoryType,
} from "../types";
import { parseMulticallResults } from "../utils/multicall";
import { ClientService } from "./clientService";

const SECONDS_TO_MILLISECONDS = 1000;
const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const ZERO_HASH = `0x${"0".repeat(64)}`;

const FUNCTION_SELECTORS = {
  ERC20_TRANSFER: "0x" + "a9059cbb",
  ERC20_TRANSFER_FROM: "0x" + "23b872dd",
  ERC20_APPROVE: "0x" + "095ea7b3",
  CUSTOM_APPROVAL: "0x" + "d77c9b49",
} as const;

interface ActionDetails {
  actionsData: Hex;
  executableAt: bigint;
  expiresAt: bigint;
  safeTxHash: Hash;
  approvalExpiry: bigint;
  approvers: Address[];
}

interface FactoryClassification {
  [actionAddress: Address]: {
    factoryType: ActionFactoryType;
    factoryLabel: string;
    actionBuilderAddress: Address;
  };
}

export class CanonGuardService {
  private clientService: ClientService;

  constructor(clientService: ClientService) {
    this.clientService = clientService;
  }

  private get client(): PublicClient {
    return this.clientService.getClient();
  }

  async getCanonVaultData(
    entrypointAddress: Address,
    safeThreshold: number,
  ): Promise<Omit<CanonVaultData, "safeInfo">> {
    const allActionAddresses = await this.fetchAllActionAddresses(entrypointAddress);

    const actionDetailsMap = await this.fetchActionDetails(entrypointAddress, allActionAddresses);

    const factoryClassifications = await this.classifyActionsByFactory(allActionAddresses);

    const { queuedTransactions, preApprovedItems } = this.buildFinalActionObjects(
      allActionAddresses,
      actionDetailsMap,
      factoryClassifications,
      safeThreshold,
    );

    return {
      queuedTransactions,
      preApprovedItems,
      executionHistory: [],
    };
  }

  private async fetchAllActionAddresses(entrypointAddress: Address): Promise<Address[]> {
    try {
      const queuedResult = await this.client.readContract({
        address: entrypointAddress,
        abi: [
          {
            type: "function",
            name: "getQueuedTransactions",
            inputs: [],
            outputs: [{ name: "", type: "address[]" }],
            stateMutability: "view",
          },
        ],
        functionName: "getQueuedTransactions",
      });

      const queued = Array.isArray(queuedResult) ? queuedResult : [];
      return queued;
    } catch (error) {
      console.error("Failed to fetch action addresses:", error);
      return [];
    }
  }

  private async fetchActionDetails(
    entrypointAddress: Address,
    actionAddresses: Address[],
  ): Promise<Map<Address, ActionDetails>> {
    if (actionAddresses.length === 0) return new Map();

    try {
      const safeNonce = await this.getSafeNonce(entrypointAddress);
      const detailsMap = new Map<Address, ActionDetails>();

      // We fetch all the details in one multicall
      const contracts = actionAddresses.flatMap((address) => [
        {
          address: entrypointAddress,
          abi: canonGuardEntrypointAbi,
          functionName: "queuedTransactions",
          args: [address],
        },
        {
          address: entrypointAddress,
          abi: canonGuardEntrypointAbi,
          functionName: "getSafeTransactionHash",
          args: [address],
        },
        {
          address: entrypointAddress,
          abi: canonGuardEntrypointAbi,
          functionName: "approvalExpiries",
          args: [address],
        },
        {
          address: entrypointAddress,
          abi: canonGuardEntrypointAbi,
          functionName: "getApprovedHashSigners",
          args: [address, BigInt(safeNonce)],
        },
      ]);

      const results = await this.client.multicall({ contracts });
      const values = parseMulticallResults(results);

      // Now we iterate over the results, knowing that types will repeat every 4 items
      for (let i = 0; i < actionAddresses.length; i++) {
        const actionAddress = actionAddresses[i];
        const baseIndex = i * 4;

        const queuedTransactionResult = values[baseIndex] as [Hex, bigint, bigint];
        const safeTxHash = values[baseIndex + 1] as Hash;
        const approvalExpiry = values[baseIndex + 2] as bigint;
        const approvers = values[baseIndex + 3] as Address[];

        if (!queuedTransactionResult) continue;

        const [actionsData, executableAt, expiresAt] = queuedTransactionResult;

        detailsMap.set(actionAddress, {
          actionsData,
          executableAt,
          expiresAt,
          safeTxHash,
          approvalExpiry,
          approvers,
        });
      }

      return detailsMap;
    } catch (error) {
      console.error("Failed to fetch action details:", error);
      return new Map();
    }
  }

  private async identifyActionBuilderFactory(actionBuilderAddress: Address): Promise<{
    factoryType: ActionFactoryType;
    factoryLabel: string;
  }> {
    const directFactoryMatch = KNOWN_FACTORY_MAPPINGS[actionBuilderAddress];
    if (directFactoryMatch) {
      return { factoryType: directFactoryMatch.type, factoryLabel: directFactoryMatch.label };
    }

    let actionsResult;
    try {
      actionsResult = await this.client.readContract({
        address: actionBuilderAddress,
        abi: actionBuilderAbi,
        functionName: "getActions",
      });
    } catch {
      actionsResult = null;
    }

    if (!actionsResult || !Array.isArray(actionsResult) || actionsResult.length === 0) {
      return { factoryType: ActionFactoryType.UNKNOWN, factoryLabel: getFactoryLabel(actionBuilderAddress) };
    }

    const firstAction = actionsResult[0];
    if (!firstAction || typeof firstAction !== "object" || !("data" in firstAction)) {
      return { factoryType: ActionFactoryType.UNKNOWN, factoryLabel: getFactoryLabel(actionBuilderAddress) };
    }

    const data = (firstAction as { data: string }).data.toLowerCase();

    if (data.startsWith(FUNCTION_SELECTORS.ERC20_TRANSFER) || data.startsWith(FUNCTION_SELECTORS.ERC20_TRANSFER_FROM)) {
      return {
        factoryType: ActionFactoryType.SIMPLE_TRANSFERS,
        factoryLabel: getFactoryLabelByType(ActionFactoryType.SIMPLE_TRANSFERS),
      };
    }

    if (data.startsWith(FUNCTION_SELECTORS.ERC20_APPROVE) || data.startsWith(FUNCTION_SELECTORS.CUSTOM_APPROVAL)) {
      return {
        factoryType: ActionFactoryType.APPROVE_ACTION,
        factoryLabel: getFactoryLabelByType(ActionFactoryType.APPROVE_ACTION),
      };
    }

    return { factoryType: ActionFactoryType.UNKNOWN, factoryLabel: getFactoryLabel(actionBuilderAddress) };
  }

  private async classifyActionsByFactory(actionBuilderAddresses: Address[]): Promise<FactoryClassification> {
    if (actionBuilderAddresses.length === 0) return {};

    const classification: FactoryClassification = {};

    for (const actionBuilderAddress of actionBuilderAddresses) {
      const factoryInfo = await this.identifyActionBuilderFactory(actionBuilderAddress);

      classification[actionBuilderAddress] = {
        factoryType: factoryInfo.factoryType,
        factoryLabel: factoryInfo.factoryLabel,
        actionBuilderAddress: actionBuilderAddress,
      };
    }
    // TODO: Research using blockchain events to track factory deployments for proper classification

    return classification;
  }

  private buildFinalActionObjects(
    allActionAddresses: Address[],
    actionDetailsMap: Map<Address, ActionDetails>,
    factoryClassifications: FactoryClassification,
    safeThreshold: number,
  ): { queuedTransactions: QueuedTransaction[]; preApprovedItems: PreApprovedItem[] } {
    const now = Date.now() / SECONDS_TO_MILLISECONDS;
    const queuedTransactions: QueuedTransaction[] = [];
    const preApprovedItems: PreApprovedItem[] = [];

    for (const [actionAddress, details] of actionDetailsMap.entries()) {
      const { executableAt, expiresAt, safeTxHash, approvalExpiry, approvers } = details;

      const executableTimestamp = Number(executableAt);
      const expiresTimestamp = Number(expiresAt);

      let state: QueuedTransactionState;
      if (expiresTimestamp < now) {
        state = QueuedTransactionState.EXPIRED;
      } else if (executableTimestamp <= now) {
        state = QueuedTransactionState.EXECUTABLE;
      } else {
        state = QueuedTransactionState.QUEUED;
      }

      const classification = factoryClassifications[actionAddress];
      const factoryType =
        classification?.factoryType || getFactoryType(actionAddress) || ActionFactoryType.SIMPLE_ACTIONS;
      const factoryLabel = classification?.factoryLabel || getFactoryLabel(actionAddress);
      const actionBuilderAddress = classification?.actionBuilderAddress || actionAddress;
      const isApproved = Number(approvalExpiry) > now;
      const actionBuilder = {
        address: actionAddress,
        factoryType,
        actionBuilderAddress,
        factoryLabel,
        // TODO: Get real creation timestamp from blockchain events instead of assuming 1 day before executable
        createdAt: new Date(executableTimestamp * SECONDS_TO_MILLISECONDS - ONE_DAY_IN_MILLISECONDS),
        isApproved,
        approvalExpiresAt: isApproved ? new Date(Number(approvalExpiry) * SECONDS_TO_MILLISECONDS) : undefined,
      };

      if (allActionAddresses.includes(actionAddress)) {
        queuedTransactions.push({
          actionBuilder,
          state,
          // TODO: Get real queued timestamp from blockchain events instead of assuming 1 hour before executable
          queuedAt: new Date(executableTimestamp * SECONDS_TO_MILLISECONDS - ONE_HOUR_IN_MILLISECONDS),
          executableAt: new Date(executableTimestamp * SECONDS_TO_MILLISECONDS),
          expiresAt: new Date(expiresTimestamp * SECONDS_TO_MILLISECONDS),
          safeTxHash,
          approversCount: approvers.length,
          requiredApprovals: safeThreshold,
          approvers,
        });
      }

      const hasPartialApprovals = approvers.length > 0 && approvers.length < safeThreshold;
      const hasValidNonce = safeTxHash && safeTxHash !== ZERO_HASH;

      if (hasPartialApprovals && hasValidNonce) {
        preApprovedItems.push({
          address: actionAddress,
          type: PreApprovedItemType.BUILDER,
          factoryType,
          // TODO: Get real approval timestamp from blockchain events instead of assuming 1 day before executable
          approvedAt: new Date(executableTimestamp * SECONDS_TO_MILLISECONDS - ONE_DAY_IN_MILLISECONDS),
          expiresAt: new Date(expiresTimestamp * SECONDS_TO_MILLISECONDS),
          approvalDuration: Math.max(0, expiresTimestamp - now),
          safeTxHash,
          approversCount: approvers.length,
          requiredApprovals: safeThreshold,
          approvers,
        });
      }
    }

    queuedTransactions.sort((a, b) => b.queuedAt.getTime() - a.queuedAt.getTime());
    preApprovedItems.sort((a, b) => b.approvedAt.getTime() - a.approvedAt.getTime());

    return { queuedTransactions, preApprovedItems };
  }

  private async getSafeNonce(entrypointAddress: Address): Promise<number> {
    try {
      const result = await this.client.readContract({
        address: entrypointAddress,
        abi: canonGuardEntrypointAbi,
        functionName: "getSafeNonce",
      });
      return typeof result === "bigint" ? Number(result) : 0;
    } catch {
      return 0;
    }
  }
}
