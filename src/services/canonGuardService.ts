import { Address } from "viem";
import { QueuedAction, Approval, PreApprovedAction, SafeConfiguration, ActionDetails, SafeData } from "../types/safe";
import { safeService } from "./safeService";

// Factory labels for known factories
export const FACTORY_LABELS: Record<string, string> = {
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "Uniswap Factory",
  "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24": "Compound Factory",
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAI Factory",
};

class CanonGuardService {
  async getQueuedActions(_safe: Address): Promise<QueuedAction[]> {
    void _safe;
    return [
      {
        id: "1",
        actionHash: "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
        factoryAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        factoryLabel: FACTORY_LABELS["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"],
        isPreApproved: false,
        queuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        executionTime: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
        timeRemainingToExecutable: 22 * 60 * 60 * 1000,
      },
      {
        id: "2",
        actionHash: "0xefgh5678901234567890abcd5678901234567890abcd5678901234567890efgh",
        factoryAddress: "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24",
        factoryLabel: FACTORY_LABELS["0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24"],
        isPreApproved: true,
        queuedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        executionTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        timeRemainingToExecutable: 1 * 60 * 60 * 1000,
      },
    ];
  }

  async getApprovals(_safe: Address): Promise<Approval[]> {
    void _safe;
    return [
      {
        id: "1",
        actionHash: "0xijkl9012345678901234567890123456789012345678901234567890ijkl9012",
        factoryAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        factoryLabel: FACTORY_LABELS["0x6B175474E89094C44Da98b954EedeAC495271d0F"],
        isPreApproved: false,
        queuedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        executionTime: new Date(Date.now() + 21 * 60 * 60 * 1000),
        timeRemainingToExecutable: 21 * 60 * 60 * 1000,
        nonce: 5,
        approvalsCount: 1,
        approvalThreshold: 2,
      },
    ];
  }

  async getPreApprovedActions(_safe: Address): Promise<PreApprovedAction[]> {
    void _safe;
    return [
      {
        id: "1",
        isHub: false,
        address: "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24",
        approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
      },
      {
        id: "2",
        isHub: true,
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
      },
    ];
  }

  async getGuardConfiguration(safe: Address): Promise<SafeConfiguration> {
    return {
      safeAddress: safe,
      entrypointAddress: "0x1234567890123456789012345678901234567890",
      shortTransactionDelay: 3600, // 1 hour
      longTransactionDelay: 86400, // 24 hours
      transactionExpiryDelay: 604800, // 7 days
      maxApprovalDuration: 2592000, // 30 days
      emergencyTriggerAddress: "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
      emergencyCallerAddress: "0xefefefefefefefefefefefefefefefefefefef",
    };
  }

  async getActionDetails(actionHash: string): Promise<ActionDetails> {
    return {
      actionHash,
      factoryAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      calldata:
        "0x095ea7b3000000000000000000000000a0b86a33e6441097c3be01cf8ba5c2c70a3c8b24000000000000000000000000000000000000000000000000de0b6b3a7640000",
      value: "0",
      target: "0xA0b86a33E6441097C3be01cF8BA5c2C70A3c8B24",
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

  // Combined method to get all Safe data at once
  async getSafeData(safe: Address): Promise<SafeData> {
    const [safeInfo, configuration, queuedActions, waitingForApprovalActions, preApprovedActions] = await Promise.all([
      safeService.getSafeInfo(safe),
      this.getGuardConfiguration(safe),
      this.getQueuedActions(safe),
      this.getApprovals(safe),
      this.getPreApprovedActions(safe),
    ]);

    return {
      safeInfo,
      configuration,
      queuedActions: queuedActions.map((action) => ({
        ...action,
        factoryLabel: action.factoryLabel || FACTORY_LABELS[action.factoryAddress],
      })),
      waitingForApprovalActions: waitingForApprovalActions.map((action) => ({
        ...action,
        factoryLabel: action.factoryLabel || FACTORY_LABELS[action.factoryAddress],
      })),
      preApprovedActions,
    };
  }
}

export const canonGuardService = new CanonGuardService();
