/**
 * QueueSignSection - Signing flow for queue items
 *
 * This component provides a dedicated signing flow when clicking "Sign" on a queue item.
 * It shows the NonceSelector and Sign Transaction step.
 *
 * - If the item has no signatures (approversCount === 0), nonce is editable
 * - If the item has existing signatures (approversCount > 0), nonce is read-only (locked to item.nonce)
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { Box, CircularProgress, styled } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Address, encodeFunctionData } from "viem";
import { safeAbi } from "~/abis/canonGuard";
import { getRpcUrlForChain, getViemChain } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams, useTransactionExecutor, useWallet } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import { ClientService } from "~/services/clientService";
import { QueueService, type QueueItem } from "~/services/queueService";
import type { TransactionStep } from "~/services/transactionBuilderService";
import { zeroHash } from "~/utils";
import { SigningFlowStep } from "./NewAction/steps";

interface QueueSignState {
  actionBuilderAddress: Address;
  label: string;
  factoryLabel: string;
  nonce: number;
  approversCount: number;
  threshold: number;
}

interface QueueSignSectionProps {
  onQueueCountChange?: () => void;
  safeOwners?: Address[];
}

export const QueueSignSection = ({ onQueueCountChange, safeOwners = [] }: QueueSignSectionProps) => {
  const location = useLocation();
  const navigateWithParams = useNavigateWithParams();
  const { safeAddress, guardAddress, chainId } = useStateContext();
  const { address: connectedAddress, isConnected } = useWallet();

  // Check if connected wallet is a Safe signer
  const isSigner =
    isConnected &&
    connectedAddress &&
    safeOwners.some((owner) => owner.toLowerCase() === connectedAddress.toLowerCase());

  // Get state passed from Queue
  const navigationState = location.state as QueueSignState | null;

  // Transaction executor
  const { executeSignTransaction } = useTransactionExecutor();

  // Steps state
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Nonce selection state
  const [currentSafeNonce, setCurrentSafeNonce] = useState<number>(0);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [nonceDataLoaded, setNonceDataLoaded] = useState(false);

  // Create service instances
  const clientService = useMemo(() => {
    const rpcUrl = getRpcUrlForChain(chainId as number);
    const chain = getViemChain(chainId as number);
    return new ClientService(rpcUrl, chain);
  }, [chainId]);
  const queueService = useMemo(() => new QueueService(clientService), [clientService]);

  // Determine if nonce should be read-only (item already has signatures)
  const isNonceLocked = (navigationState?.approversCount ?? 0) > 0;

  // Build transaction steps (single Sign step)
  const buildSignSteps = useCallback((): TransactionStep[] => {
    const signData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: [zeroHash],
    });

    return [
      {
        id: "sign-transaction",
        title: "Sign Transaction",
        description: "Approve the transaction hash in the Safe",
        status: "pending",
        to: safeAddress as Address,
        data: signData,
      },
    ];
  }, [safeAddress]);

  // Initialize on mount
  useEffect(() => {
    // If no navigation state, redirect back to queue
    if (!navigationState) {
      console.log("[QueueSignSection] No navigation state, redirecting to queue");
      navigateWithParams("/queue");
      return;
    }

    if (!initialized && guardAddress && safeAddress) {
      console.log("[QueueSignSection] Initializing sign flow for:", navigationState.label);
      const steps = buildSignSteps();
      setTransactionSteps(steps);
      setCurrentStepIndex(0);
      setInitialized(true);
    }
  }, [navigationState, initialized, guardAddress, safeAddress, buildSignSteps, navigateWithParams]);

  // Fetch nonce data
  useEffect(() => {
    if (!initialized || !guardAddress || !safeAddress || nonceDataLoaded) {
      return;
    }

    const fetchNonceData = async () => {
      try {
        console.log("[QueueSignSection] Fetching nonce data");
        const [nonce, items] = await Promise.all([
          queueService.getCurrentSafeNonce(guardAddress as Address),
          queueService.getQueueItems(guardAddress as Address, safeAddress as Address),
        ]);
        console.log("[QueueSignSection] Nonce data loaded:", { nonce, queueItemsCount: items.length });
        setCurrentSafeNonce(nonce);
        setQueueItems(items);
        setNonceDataLoaded(true);
      } catch (error) {
        console.error("[QueueSignSection] Failed to fetch nonce data:", error);
        setCurrentSafeNonce(navigationState?.nonce ?? 0);
        setQueueItems([]);
        setNonceDataLoaded(true);
      }
    };

    fetchNonceData();
  }, [initialized, guardAddress, safeAddress, queueService, nonceDataLoaded, navigationState?.nonce]);

  // Handle executing the sign step
  const handleExecuteStep = useCallback(
    async (selectedNonce?: number) => {
      if (!navigationState || !safeAddress || !guardAddress) {
        console.error("[QueueSignSection] Missing required state for signing");
        return;
      }

      const currentStep = transactionSteps[currentStepIndex];
      if (!currentStep || currentStep.id !== "sign-transaction") {
        console.error("[QueueSignSection] Invalid step");
        return;
      }

      // Use provided nonce, or fall back to item's nonce (for locked nonce case)
      const nonceToUse = selectedNonce !== undefined ? selectedNonce : navigationState.nonce;
      console.log("[QueueSignSection] Signing transaction with nonce:", nonceToUse);

      // Update step status to in-progress
      setTransactionSteps((prev) =>
        prev.map((step, idx) => (idx === currentStepIndex ? { ...step, status: "in-progress" as const } : step)),
      );

      try {
        const result = await executeSignTransaction(
          safeAddress as Address,
          guardAddress as Address,
          navigationState.actionBuilderAddress,
          nonceToUse,
        );

        if (result) {
          console.log("[QueueSignSection] Sign successful:", result.safeTxHash);

          // Update step to success
          setTransactionSteps((prev) =>
            prev.map((step, idx) =>
              idx === currentStepIndex ? { ...step, status: "success" as const, hash: result.txHash } : step,
            ),
          );

          // Mark as complete to show success screen
          setIsComplete(true);

          // Notify that queue count may have changed
          onQueueCountChange?.();
        } else {
          throw new Error("Sign transaction returned no result");
        }
      } catch (error) {
        console.error("[QueueSignSection] Sign failed:", error);
        setTransactionSteps((prev) =>
          prev.map((step, idx) => (idx === currentStepIndex ? { ...step, status: "error" as const } : step)),
        );
      }
    },
    [
      navigationState,
      safeAddress,
      guardAddress,
      transactionSteps,
      currentStepIndex,
      executeSignTransaction,
      onQueueCountChange,
    ],
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigateWithParams("/queue");
  }, [navigateWithParams]);

  // Handle navigate to create (not used in queue sign flow, just go back)
  const handleNavigateToCreate = useCallback(() => {
    navigateWithParams("/queue");
  }, [navigateWithParams]);

  // Loading state
  if (!navigationState || !initialized || !nonceDataLoaded) {
    return (
      <LoadingContainer>
        <CircularProgress size={40} sx={{ color: canonHeaderTokens.brand.green }} />
      </LoadingContainer>
    );
  }

  return (
    <SigningFlowStep
      steps={transactionSteps}
      currentStepIndex={currentStepIndex}
      onBack={handleBack}
      onNavigateToCreate={handleNavigateToCreate}
      onSimulateSign={handleExecuteStep}
      isComplete={isComplete}
      actionTitle={navigationState.label || "Untitled Transaction"}
      factoryType={navigationState.factoryLabel || "Unknown"}
      hideParameters={true}
      breadcrumbPage='Sign Transaction'
      breadcrumbStandalone={true}
      nonceSelectionEnabled={true}
      currentSafeNonce={currentSafeNonce}
      queueItems={queueItems}
      isNonceLocked={isNonceLocked}
      lockedNonce={navigationState.nonce}
      isSigner={isSigner}
    />
  );
};

const LoadingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "400px",
});
