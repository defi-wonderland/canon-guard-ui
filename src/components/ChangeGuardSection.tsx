import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { Address, encodeFunctionData } from "viem";
import { canonGuardAbi, safeAbi } from "~/abis/canonGuard";
import { changeSafeGuardActionFactoryAbi } from "~/abis/canonGuard";
import { SigningFlowStep } from "~/components/NewAction/steps/SigningFlowStep";
import { getRpcUrlForChain, getChainConfig } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { CHANGE_SAFE_GUARD_ACTION_FACTORY } from "~/constants/canonGuard";
import { useStateContext, useNavigateWithParams, useIsSigner } from "~/hooks";
import { useTransactionExecutor } from "~/hooks/useTransactionExecutor";
import { ClientService, QueueService, type QueueItem } from "~/services";
import type { TransactionStep } from "~/services/transactionBuilderService";
import { zeroAddress, zeroHash } from "~/utils";

type ChangeGuardMode = "attach" | "detach";

interface ChangeGuardSectionProps {
  mode: ChangeGuardMode;
  onQueueCountChange?: () => void;
}

// Mode-specific labels
const MODE_CONFIG = {
  attach: {
    actionVerb: "Attach",
    actionTitle: "Attach Canon Guard",
    factoryType: "ATTACH GUARD",
    loadingText: "Initializing Attach Guard Flow...",
    deployTitle: "Deploy Attach Action",
    deployDescription: "Deploy a ChangeSafeGuardAction contract that will attach the Canon Guard to your Safe",
    queueTitle: "Queue Attach Action",
    queueDescription: "Add the attach action to the Canon Guard queue",
    signTitle: "Sign Attach Action",
    signDescription: "Sign the Safe transaction to approve the attach action",
  },
  detach: {
    actionVerb: "Detach",
    actionTitle: "Detach Canon Guard",
    factoryType: "DETACH GUARD",
    loadingText: "Initializing Detach Guard Flow...",
    deployTitle: "Deploy Detach Action",
    deployDescription: "Deploy a ChangeSafeGuardAction contract that will remove the Canon Guard from your Safe",
    queueTitle: "Queue Detach Action",
    queueDescription: "Add the detach action to the Canon Guard queue",
    signTitle: "Sign Detach Action",
    signDescription: "Sign the Safe transaction to approve the detach action",
  },
} as const;

export const ChangeGuardSection = ({ mode, onQueueCountChange }: ChangeGuardSectionProps) => {
  const navigateWithParams = useNavigateWithParams();
  const { guardAddress, safeAddress, chainId } = useStateContext();
  const isSigner = useIsSigner();
  const config = MODE_CONFIG[mode];

  const { executeDeployChangeSafeGuardAction, executeQueueTransaction, executeSignTransaction } =
    useTransactionExecutor();

  // Flow state
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSigningComplete, setIsSigningComplete] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Deployed action address (set after deploy step)
  const [deployedActionAddress, setDeployedActionAddress] = useState<Address | null>(null);

  // Nonce selection state
  const [currentSafeNonce, setCurrentSafeNonce] = useState<number>(0);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [nonceDataLoaded, setNonceDataLoaded] = useState(false);

  // Create client and queue services
  const clientService = useMemo(() => {
    const rpcUrl = getRpcUrlForChain(chainId as number);
    const chain = getChainConfig(chainId as number).chain;
    return new ClientService(rpcUrl, chain);
  }, [chainId]);

  const queueService = useMemo(() => new QueueService(clientService), [clientService]);

  // Target address for the guard change:
  // - attach: use the current guardAddress (from context)
  // - detach: use address(0)
  const targetGuardAddress = useMemo(() => {
    if (mode === "attach") {
      return guardAddress as Address;
    }
    return zeroAddress;
  }, [mode, guardAddress]);

  // Build the 3-step transaction flow
  const buildChangeGuardSteps = useCallback((): TransactionStep[] => {
    if (!guardAddress || !safeAddress) return [];

    const steps: TransactionStep[] = [];

    // Step 1: Deploy ChangeSafeGuardAction
    const deployData = encodeFunctionData({
      abi: changeSafeGuardActionFactoryAbi,
      functionName: "createChangeSafeGuardAction",
      args: [targetGuardAddress],
    });

    steps.push({
      id: "deploy-change-guard-action",
      title: config.deployTitle,
      description: config.deployDescription,
      status: "pending",
      to: CHANGE_SAFE_GUARD_ACTION_FACTORY,
      data: deployData,
    });

    // Step 2: Queue the transaction
    const queueData = encodeFunctionData({
      abi: canonGuardAbi,
      functionName: "queueTransaction",
      args: [zeroAddress], // Placeholder, will be replaced
    });

    steps.push({
      id: "queue-change-guard-action",
      title: config.queueTitle,
      description: config.queueDescription,
      status: "waiting",
      to: guardAddress as Address,
      data: queueData,
    });

    // Step 3: Sign the transaction
    const signData = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: [zeroHash],
    });

    steps.push({
      id: "sign-change-guard-action",
      title: config.signTitle,
      description: config.signDescription,
      status: "waiting",
      to: safeAddress as Address,
      data: signData,
    });

    return steps;
  }, [guardAddress, safeAddress, targetGuardAddress, config]);

  // Initialize the flow
  useEffect(() => {
    if (!initialized && guardAddress && safeAddress) {
      const steps = buildChangeGuardSteps();
      setTransactionSteps(steps);
      setCurrentStepIndex(0);
      setInitialized(true);
    }
  }, [initialized, guardAddress, safeAddress, buildChangeGuardSteps]);

  // Fetch nonce data when flow is initialized
  useEffect(() => {
    if (!initialized || !guardAddress || !safeAddress || nonceDataLoaded) return;

    const fetchNonceData = async () => {
      try {
        const [nonce, items] = await Promise.all([
          queueService.getCurrentSafeNonce(guardAddress as Address),
          queueService.getQueueItems(guardAddress as Address, safeAddress as Address),
        ]);
        setCurrentSafeNonce(nonce);
        setQueueItems(items);
        setNonceDataLoaded(true);
      } catch (error) {
        console.error(`[ChangeGuardSection:${mode}] Failed to fetch nonce data:`, error);
        setCurrentSafeNonce(0);
        setQueueItems([]);
        setNonceDataLoaded(true);
      }
    };

    fetchNonceData();
  }, [initialized, guardAddress, safeAddress, queueService, nonceDataLoaded, mode]);

  // Handle step execution
  const handleExecuteStep = useCallback(
    async (nonce?: number) => {
      if (currentStepIndex >= transactionSteps.length) return;

      const currentStep = transactionSteps[currentStepIndex];
      const stepIndex = currentStepIndex;

      // Update status to waiting
      setTransactionSteps((prev) => {
        const updated = [...prev];
        updated[stepIndex] = { ...updated[stepIndex], status: "waiting" };
        return updated;
      });

      // Step 1: Deploy ChangeSafeGuardAction
      if (currentStep.id === "deploy-change-guard-action") {
        console.log(`[ChangeGuardSection:${mode}] Executing deploy step`);

        // Pass guardAddress for attach, undefined for detach (will use address(0))
        const deployAddress = mode === "attach" ? (guardAddress as Address) : undefined;
        const result = await executeDeployChangeSafeGuardAction(deployAddress);

        if (result) {
          console.log(`[ChangeGuardSection:${mode}] Deploy successful:`, result.deployedAddress);
          setDeployedActionAddress(result.deployedAddress);

          // Update step to signed and move to next
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed", hash: result.txHash };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Step 2: Queue the transaction
      if (currentStep.id === "queue-change-guard-action") {
        console.log(`[ChangeGuardSection:${mode}] Executing queue step`);

        if (!guardAddress || !deployedActionAddress) {
          console.error(`[ChangeGuardSection:${mode}] Missing addresses for queue step`);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeQueueTransaction(guardAddress as Address, deployedActionAddress);

        if (result) {
          console.log(`[ChangeGuardSection:${mode}] Queue successful:`, result.txHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed", hash: result.txHash };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Step 3: Sign the transaction
      if (currentStep.id === "sign-change-guard-action") {
        console.log(`[ChangeGuardSection:${mode}] Executing sign step`);

        if (!safeAddress || !guardAddress || !deployedActionAddress) {
          console.error(`[ChangeGuardSection:${mode}] Missing addresses for sign step`);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeSignTransaction(
          safeAddress as Address,
          guardAddress as Address,
          deployedActionAddress,
          nonce,
        );

        if (result) {
          console.log(`[ChangeGuardSection:${mode}] Sign successful:`, result.safeTxHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed", hash: result.txHash };
            return updated;
          });
          setIsSigningComplete(true);
          onQueueCountChange?.();
        } else {
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }
    },
    [
      currentStepIndex,
      transactionSteps,
      guardAddress,
      safeAddress,
      deployedActionAddress,
      executeDeployChangeSafeGuardAction,
      executeQueueTransaction,
      executeSignTransaction,
      onQueueCountChange,
      mode,
    ],
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigateWithParams("/settings");
  }, [navigateWithParams]);

  // Handle navigate to create (just go back to settings in this context)
  const handleNavigateToCreate = useCallback(() => {
    navigateWithParams("/settings");
  }, [navigateWithParams]);

  // Loading state
  if (!initialized || transactionSteps.length === 0) {
    return (
      <LoadingContainer>
        <CircularProgress size={40} sx={{ color: canonHeaderTokens.brand.green }} />
        <LoadingText>{config.loadingText}</LoadingText>
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
      isComplete={isSigningComplete}
      actionTitle={config.actionTitle}
      factoryType={config.factoryType}
      hideParameters={true}
      breadcrumbPage='Settings'
      breadcrumbStandalone={true}
      nonceSelectionEnabled={nonceDataLoaded}
      currentSafeNonce={currentSafeNonce}
      queueItems={queueItems}
      isSigner={isSigner}
    />
  );
};

// Styled Components
const LoadingContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "400px",
  gap: "16px",
});

const LoadingText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
});
