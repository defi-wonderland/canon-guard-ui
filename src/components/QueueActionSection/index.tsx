import { useState, useCallback, useEffect, useMemo } from "react";
import { Box, CircularProgress, styled } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Address, Hex, encodeFunctionData } from "viem";
import { canonGuardAbi, safeAbi, preApproveActionFactoryAbi } from "~/abis/canonGuard";
import { getRpcUrlForChain, getViemChain } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { PRE_APPROVE_ACTION_FACTORY } from "~/constants/canonGuard";
import { useNavigateWithParams, useTransactionExecutor } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import { ClientService } from "~/services/clientService";
import { QueueService, type QueueItem } from "~/services/queueService";
import type { TransactionStep } from "~/services/transactionBuilderService";
import { SigningFlowStep } from "../NewAction/steps";

interface QueueActionState {
  actionBuilderAddress: Address;
  label: string;
  factoryType: string;
  /** For pre-approve mode: approval duration in seconds */
  approvalDuration?: bigint;
}

/**
 * QueueActionSection - Handles queuing/pre-approving existing actions from Canon List
 *
 * This component reuses the SigningFlowStep to provide a consistent UX.
 *
 * Supports two modes (determined by presence of approvalDuration in state):
 * - Queue mode: Queue action + Sign (2 steps)
 * - Pre-approve mode: Deploy pre-approve + Queue + Sign (3 steps)
 *
 * Note: This flow requires navigation state. If state is missing (e.g., on page refresh),
 * it redirects back to canon-list to restart the flow.
 */
export const QueueActionSection = () => {
  const location = useLocation();
  const navigateWithParams = useNavigateWithParams();
  const { safeAddress, guardAddress, chainId } = useStateContext();

  // Get state passed from Canon List (required - redirects if missing)
  const navigationState = location.state as QueueActionState | null;

  // Determine if we're in pre-approve mode based on presence of approvalDuration
  const isPreApproveMode = Boolean(navigationState?.approvalDuration);

  // Transaction executor hook for real blockchain transactions
  const { executeQueueTransaction, executeSignTransaction, executeDeployPreApproval } = useTransactionExecutor();

  // Pre-approve mode state - track deployed address
  const [deployedPreApproveAddress, setDeployedPreApproveAddress] = useState<Address | null>(null);

  // Steps state
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

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

  // Build transaction steps for queue mode (2 steps)
  const buildQueueSteps = useCallback(
    (actionBuilderAddress: Address): TransactionStep[] => {
      const steps: TransactionStep[] = [];

      // Step 1: Queue Transaction
      const queueData = encodeFunctionData({
        abi: canonGuardAbi,
        functionName: "queueTransaction",
        args: [actionBuilderAddress],
      });

      steps.push({
        id: "queue-transaction",
        title: "Queue Transaction",
        description: "Queue the action builder in Canon Guard",
        status: "pending",
        to: guardAddress as Address,
        data: queueData,
      });

      // Step 2: Sign Transaction
      const signData = encodeFunctionData({
        abi: safeAbi,
        functionName: "approveHash",
        args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
      });

      steps.push({
        id: "sign-transaction",
        title: "Sign Transaction",
        description: "Approve the transaction hash in the Safe",
        status: "pending",
        to: safeAddress as Address,
        data: signData,
      });

      return steps;
    },
    [guardAddress, safeAddress],
  );

  // Build transaction steps for pre-approve mode (3 steps)
  const buildPreApproveSteps = useCallback(
    (actionBuilderAddress: Address, duration: bigint): TransactionStep[] => {
      const steps: TransactionStep[] = [];

      // Step 1: Deploy Pre-Approve Action
      const deployData = encodeFunctionData({
        abi: preApproveActionFactoryAbi,
        functionName: "createPreApproveAction",
        args: [actionBuilderAddress, duration],
      });

      steps.push({
        id: "deploy-preapprove",
        title: "Deploy Pre-Approval",
        description: "Deploy a pre-approval action for this action builder",
        status: "pending",
        to: PRE_APPROVE_ACTION_FACTORY,
        data: deployData,
      });

      // Step 2: Queue Pre-Approve (placeholder - will use deployed address)
      const queueData = encodeFunctionData({
        abi: canonGuardAbi,
        functionName: "queueTransaction",
        args: ["0x0000000000000000000000000000000000000000" as Address], // Placeholder
      });

      steps.push({
        id: "queue-preapprove",
        title: "Queue Pre-Approval",
        description: "Queue the pre-approval action in Canon Guard",
        status: "pending",
        to: guardAddress as Address,
        data: queueData,
      });

      // Step 3: Sign Pre-Approve
      const signData = encodeFunctionData({
        abi: safeAbi,
        functionName: "approveHash",
        args: ["0x0000000000000000000000000000000000000000000000000000000000000000" as Hex],
      });

      steps.push({
        id: "sign-preapprove",
        title: "Sign Pre-Approval",
        description: "Approve the pre-approval transaction hash in the Safe",
        status: "pending",
        to: safeAddress as Address,
        data: signData,
      });

      return steps;
    },
    [guardAddress, safeAddress],
  );

  // Initialize on mount - requires navigation state
  useEffect(() => {
    // If no navigation state, redirect back to canon list
    if (!navigationState?.actionBuilderAddress) {
      navigateWithParams("/canon-list");
      return;
    }

    // Build steps based on mode
    const steps =
      isPreApproveMode && navigationState.approvalDuration
        ? buildPreApproveSteps(navigationState.actionBuilderAddress, navigationState.approvalDuration)
        : buildQueueSteps(navigationState.actionBuilderAddress);

    setTransactionSteps(steps);
    setInitialized(true);
  }, [navigationState, isPreApproveMode, buildQueueSteps, buildPreApproveSteps, navigateWithParams]);

  // Fetch nonce data for nonce selection
  useEffect(() => {
    const fetchNonceData = async () => {
      if (!guardAddress || !safeAddress || nonceDataLoaded) {
        return;
      }

      try {
        console.log("[QueueActionSection] Fetching nonce data");

        const [nonce, items] = await Promise.all([
          queueService.getCurrentSafeNonce(guardAddress as Address),
          queueService.getQueueItems(guardAddress as Address, safeAddress as Address),
        ]);

        console.log("[QueueActionSection] Nonce data loaded:", { nonce, queueItemsCount: items.length });
        setCurrentSafeNonce(nonce);
        setQueueItems(items);
        setNonceDataLoaded(true);
      } catch (error) {
        console.error("[QueueActionSection] Failed to fetch nonce data:", error);
        setNonceDataLoaded(true);
      }
    };

    fetchNonceData();
  }, [guardAddress, safeAddress, queueService, nonceDataLoaded]);

  // Handle executing current step
  const handleExecuteStep = useCallback(
    async (nonce?: number) => {
      if (!navigationState?.actionBuilderAddress || !guardAddress || !safeAddress) return;
      if (currentStepIndex >= transactionSteps.length) return;

      const currentStep = transactionSteps[currentStepIndex];
      const stepIndex = currentStepIndex;

      // Update status to waiting
      setTransactionSteps((prev) => {
        const updated = [...prev];
        updated[stepIndex] = { ...updated[stepIndex], status: "waiting" };
        return updated;
      });

      try {
        let result = null;

        // Queue mode steps
        if (currentStep.id === "queue-transaction") {
          result = await executeQueueTransaction(guardAddress as Address, navigationState.actionBuilderAddress);
        } else if (currentStep.id === "sign-transaction") {
          result = await executeSignTransaction(
            safeAddress as Address,
            guardAddress as Address,
            navigationState.actionBuilderAddress,
            nonce,
          );
          console.log("[QueueActionSection] Sign transaction result:", result, "nonce:", nonce);
        }
        // Pre-approve mode steps
        else if (currentStep.id === "deploy-preapprove") {
          if (!navigationState.approvalDuration) {
            throw new Error("Approval duration not set");
          }
          const deployResult = await executeDeployPreApproval(
            navigationState.actionBuilderAddress,
            navigationState.approvalDuration,
          );
          if (deployResult?.preApprovalAddress) {
            setDeployedPreApproveAddress(deployResult.preApprovalAddress);
            result = deployResult;
          }
        } else if (currentStep.id === "queue-preapprove") {
          if (!deployedPreApproveAddress) {
            throw new Error("Pre-approve address not available");
          }
          result = await executeQueueTransaction(guardAddress as Address, deployedPreApproveAddress);
        } else if (currentStep.id === "sign-preapprove") {
          if (!deployedPreApproveAddress) {
            throw new Error("Pre-approve address not available");
          }
          result = await executeSignTransaction(
            safeAddress as Address,
            guardAddress as Address,
            deployedPreApproveAddress,
            nonce,
          );
          console.log("[QueueActionSection] Sign pre-approve result:", result, "nonce:", nonce);
        }

        if (result) {
          // Update status to signed
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            return updated;
          });

          // Move to next step
          if (stepIndex < transactionSteps.length - 1) {
            setCurrentStepIndex(stepIndex + 1);
          }
        } else {
          // Transaction failed or was rejected
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "pending" };
            return updated;
          });
        }
      } catch (error) {
        console.error("Error executing step:", error);
        setTransactionSteps((prev) => {
          const updated = [...prev];
          updated[stepIndex] = { ...updated[stepIndex], status: "error" };
          return updated;
        });
      }
    },
    [
      currentStepIndex,
      transactionSteps,
      navigationState,
      guardAddress,
      safeAddress,
      deployedPreApproveAddress,
      executeQueueTransaction,
      executeSignTransaction,
      executeDeployPreApproval,
    ],
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigateWithParams("/canon-list");
  }, [navigateWithParams]);

  // Handle navigate to create (actually goes to canon list for queue flow)
  const handleNavigateToCanonList = useCallback(() => {
    navigateWithParams("/canon-list");
  }, [navigateWithParams]);

  // Check if signing is complete
  const isSigningComplete = transactionSteps.length > 0 && transactionSteps.every((s) => s.status === "signed");

  if (!initialized || !navigationState) {
    return (
      <LoadingContainer>
        <CircularProgress sx={{ color: canonHeaderTokens.brand.green }} size={32} />
      </LoadingContainer>
    );
  }

  // Determine breadcrumb based on mode
  const breadcrumbPage = isPreApproveMode ? "Pre-Approve Action" : "Queue Action";

  return (
    <SigningFlowStep
      steps={transactionSteps}
      currentStepIndex={currentStepIndex}
      onBack={handleBack}
      onNavigateToCreate={handleNavigateToCanonList}
      onSimulateSign={handleExecuteStep}
      isComplete={isSigningComplete}
      actionTitle={navigationState.label || "Untitled Action"}
      factoryType={navigationState.factoryType || "ACTION"}
      hideParameters={true}
      breadcrumbPage={breadcrumbPage}
      breadcrumbStandalone={true}
      nonceSelectionEnabled={nonceDataLoaded}
      currentSafeNonce={currentSafeNonce}
      queueItems={queueItems}
    />
  );
};

const LoadingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "400px",
});

export default QueueActionSection;
