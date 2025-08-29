import { Address } from "viem";
import {
  QueuedTransaction,
  ExecutedTransaction,
  PreApprovedItem,
  CanonGuardConfiguration,
  ActionDetails,
  VaultData,
  ActionFactoryType,
  QueuedTransactionState,
  PreApprovedItemType,
} from "../types/canon-guard";
import { safeService } from "./safeService";

// Factory labels for known factories
export const FACTORY_LABELS: Record<string, string> = {
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "Simple Actions Factory",
  "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24": "Simple Transfers Factory",
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "Capped Token Transfers Factory",
};

class CanonGuardService {
  async getQueuedTransactions(_safe: Address): Promise<QueuedTransaction[]> {
    void _safe;
    return [
      {
        actionBuilder: {
          address: "0xaddress",
          factoryType: ActionFactoryType.SIMPLE_ACTIONS,
          factoryAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isApproved: false,
        },
        state: QueuedTransactionState.QUEUED,
        queuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        executableAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        safeTxHash: "0xaddress",
        approversCount: 1,
        requiredApprovals: 2,
        approvers: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
      },
      {
        actionBuilder: {
          address: "0xefgh5678901234567890abcd5678901234567890",
          factoryType: ActionFactoryType.SIMPLE_TRANSFERS,
          factoryAddress: "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          isApproved: true,
          approvalExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        state: QueuedTransactionState.EXECUTABLE,
        queuedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        executableAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago (executable now)
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        safeTxHash: "0xaddress",
        approversCount: 2,
        requiredApprovals: 2,
        approvers: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
      },
    ];
  }

  async getExecutionHistory(_safe: Address): Promise<ExecutedTransaction[]> {
    void _safe;
    return [
      {
        actionBuilder: {
          address: "0xaddress",
          factoryType: ActionFactoryType.CAPPED_TOKEN_TRANSFERS,
          factoryAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isApproved: false,
        },
        safeTxHash: "0xaddress",
        executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        executedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        approvers: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
        gasUsed: 150000,
        txHash: "0xaddress",
      },
    ];
  }

  async getPreApprovedItems(_safe: Address): Promise<PreApprovedItem[]> {
    void _safe;
    return [
      {
        address: "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24",
        type: PreApprovedItemType.BUILDER,
        factoryType: ActionFactoryType.SIMPLE_TRANSFERS,
        approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
        approvalDuration: 30 * 24 * 60 * 60, // 30 days in seconds
      },
      {
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        type: PreApprovedItemType.HUB,
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        approvalDuration: 30 * 24 * 60 * 60, // 30 days in seconds
      },
    ];
  }

  async getGuardConfiguration(safe: Address): Promise<CanonGuardConfiguration> {
    return {
      vaultAddress: safe,
      entrypointAddress: "0x1234567890123456789012345678901234567890",
      shortTxExecutionDelay: 3600, // 1 hour
      longTxExecutionDelay: 86400, // 24 hours
      txExpiryDelay: 604800, // 7 days
      maxApprovalDuration: 2592000, // 30 days
      emergencyTriggerAddress: "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
      emergencyCallerAddress: "0xefefefefefefefefefefefefefefefefefefef",
      isEmergencyMode: false,
    };
  }

  async getActionDetails(actionBuilder: Address): Promise<ActionDetails> {
    return {
      actionBuilder,
      target: "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24",
      value: "0",
      calldata:
        "0x095ea7b3000000000000000000000000a0b86a33e6441097c3be01cf8ba5c2c70a3c8b24000000000000000000000000000000000000000000000000de0b6b3a7640000",
      fnSignature: "approve(address,uint256)",
      decodedParams: {
        spender: "0xa0b86a33e6441097c3be01cf8ba5c2c70a3c8b24",
        amount: "1000000000000000000",
      },
    };
  }

  async isActionPreApproved(_safe: Address, actionHash: string): Promise<boolean> {
    return actionHash.includes("efgh");
  }

  async getTimeToExecution(actionHash: string): Promise<number> {
    if (actionHash.includes("efgh")) {
      return 1 * 60 * 60 * 1000; // 1 hour
    }
    return 22 * 60 * 60 * 1000; // 22 hours
  }

  async getApprovalCount(_safe: Address, nonce: number): Promise<number> {
    return nonce === 5 ? 1 : 0;
  }

  // Combined method to get all vault data at once
  async getVaultData(safe: Address): Promise<VaultData> {
    const [vaultInfo, configuration, queuedTransactions, executionHistory, preApprovedItems] = await Promise.all([
      safeService.getVaultInfo(safe),
      this.getGuardConfiguration(safe),
      this.getQueuedTransactions(safe),
      this.getExecutionHistory(safe),
      this.getPreApprovedItems(safe),
    ]);

    return {
      vaultInfo,
      configuration,
      queuedTransactions,
      preApprovedItems,
      executionHistory,
    };
  }
}

export const canonGuardService = new CanonGuardService();
