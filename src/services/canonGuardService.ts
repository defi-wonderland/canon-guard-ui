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
import { getFactoryType, getFactoryLabel } from "../constants/canonGuard";
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
    factoryAddress: Address;
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

  private async classifyActionsByFactory(factoryAddresses: Address[]): Promise<FactoryClassification> {
    if (factoryAddresses.length === 0) return {};

    const classification: FactoryClassification = {};

    try {
      const contracts = factoryAddresses.map((address) => ({
        address,
        abi: actionBuilderAbi,
        functionName: "getActions",
      }));

      const results = await this.client.multicall({ contracts });
      const values = parseMulticallResults(results);

      for (let i = 0; i < factoryAddresses.length; i++) {
        const factoryAddress = factoryAddresses[i];
        const actionsResult = values[i];

        if (actionsResult && Array.isArray(actionsResult) && actionsResult.length > 0) {
          const factoryType = getFactoryType(factoryAddress);
          const factoryLabel = getFactoryLabel(factoryAddress);

          classification[factoryAddress] = {
            factoryType,
            factoryLabel,
            factoryAddress,
          };
        }
      }
    } catch (error) {
      console.error("Failed to classify actions by factory:", error);
    }

    return classification;
  }

  private buildFinalActionObjects(
    allActionAddresses: ActionAddresses,
    actionDetailsMap: Map<Address, ActionDetails>,
    factoryClassifications: FactoryClassification,
    safeThreshold: number,
  ): { queuedTransactions: QueuedTransaction[]; preApprovedItems: PreApprovedItem[] } {
    const now = Date.now() / 1000;
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
      const factoryAddress = classification?.factoryAddress || actionAddress;
      const isApproved = Number(approvalExpiry) > now;
      const actionBuilder = {
        address: actionAddress,
        factoryType,
        factoryAddress,
        factoryLabel,
        createdAt: new Date(executableTimestamp * 1000 - 86400000),
        isApproved,
        approvalExpiresAt: isApproved ? new Date(Number(approvalExpiry) * 1000) : undefined,
      };
      if (allActionAddresses.queued.includes(actionAddress)) {
        queuedTransactions.push({
          actionBuilder,
          state,
          queuedAt: new Date(executableTimestamp * 1000 - 3600000),
          executableAt: new Date(executableTimestamp * 1000),
          expiresAt: new Date(expiresTimestamp * 1000),
          safeTxHash,
          approversCount: approvers.length,
          requiredApprovals: safeThreshold,
          approvers,
        });
      }

      if (allActionAddresses.preApproved.includes(actionAddress) && isApproved) {
        const expiryTimestamp = Number(approvalExpiry);
        const approvalDuration = expiryTimestamp - now;

        preApprovedItems.push({
          address: actionAddress,
          type: PreApprovedItemType.BUILDER,
          factoryType,
          approvedAt: new Date(expiryTimestamp * 1000 - approvalDuration * 1000),
          expiresAt: new Date(expiryTimestamp * 1000),
          approvalDuration,
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
