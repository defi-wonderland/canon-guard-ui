import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Box, Typography, styled } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import { Address, Hex, encodeFunctionData } from "viem";
import { canonGuardAbi, safeAbi } from "~/abis/canonGuard";
import { getRpcUrlForChain, getViemChain } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams, useTransactionExecutor } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import type { ParsedWalletConnectTransaction } from "~/providers/WalletConnectProvider";
import { ClientService } from "~/services/clientService";
import { QueueService, type QueueItem } from "~/services/queueService";
import { RegistryService } from "~/services/registryService";
import {
  buildTransactionSteps,
  buildArbitraryActionSteps,
  buildClaimAllowanceSteps,
  buildCappedTransferHubSteps,
  buildDeployHubChildSteps,
  type TransactionStep,
} from "~/services/transactionBuilderService";
import { CappedTokenTransfersHubInfo } from "~/types/canon-guard";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES, HUB_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  SelectFactoryStep,
  TransferFormStep,
  ArbitraryActionFormStep,
  ClaimAllowanceFormStep,
  ReviewDeployStep,
  SigningFlowStep,
  SelectHubTypeStep,
  CappedTransferHubFormStep,
  HubReviewStep,
  DeployHubChildFormStep,
  DeployHubChildReviewStep,
} from "./steps";
import type {
  TransferFormData,
  ArbitraryActionFormData,
  ClaimAllowanceFormData,
  FactoryType,
  HubType,
  CappedTransferHubFormData,
  HubChildFormData,
} from "./steps";

// Pre-deployed UnsetEmergencyModeAction contract
const UNSET_EMERGENCY_MODE_ACTION: Address = "0x68e54338e31C7A8B7c46a2BB8Fd73f3a0606A506";

const INITIAL_TRANSFER_FORM_DATA: TransferFormData = {
  title: "",
  transfers: [{ tokenAddress: "", recipientAddress: "", amount: "" }],
};

const INITIAL_ARBITRARY_ACTION_FORM_DATA: ArbitraryActionFormData = {
  title: "",
  actions: [{ target: "", signature: "", data: "", value: "" }],
};

const INITIAL_CLAIM_ALLOWANCE_FORM_DATA: ClaimAllowanceFormData = {
  title: "",
  token: "",
  tokenOwner: "",
  tokenRecipient: "",
};

const INITIAL_CAPPED_TRANSFER_HUB_FORM_DATA: CappedTransferHubFormData = {
  title: "",
  recipientAddress: "",
  epochLength: "",
  epochUnit: "months",
  tokens: [{ address: "", amount: "" }],
};

const INITIAL_HUB_CHILD_FORM_DATA: HubChildFormData = {
  title: "",
  token: "",
  amount: "",
};

interface NewActionSectionProps {
  onQueueCountChange?: () => void;
}

export const NewActionSection = ({ onQueueCountChange }: NewActionSectionProps) => {
  const location = useLocation();
  const { hubAddress: hubAddressParam } = useParams<{ hubAddress: string }>();
  const navigateWithParams = useNavigateWithParams();
  const { safeAddress, guardAddress, chainId } = useStateContext();

  // Transaction executor hook for real blockchain transactions
  const {
    executeDeployTransfer,
    executeDeployArbitraryAction,
    executeDeployClaimAllowance,
    executeDeployHubChild,
    executeDeployCappedTransferHub,
    executeRecordToRegistry,
    executeQueueTransaction,
    executeSignTransaction,
    executeDeployPreApproval,
    reset: resetExecutor,
  } = useTransactionExecutor();

  // Local state for factory selection and form data
  const [selectedFactory, setSelectedFactory] = useState<FactoryType>(null);
  const [transferFormData, setTransferFormData] = useState<TransferFormData>(INITIAL_TRANSFER_FORM_DATA);
  const [arbitraryActionFormData, setArbitraryActionFormData] = useState<ArbitraryActionFormData>(
    INITIAL_ARBITRARY_ACTION_FORM_DATA,
  );
  const [claimAllowanceFormData, setClaimAllowanceFormData] = useState<ClaimAllowanceFormData>(
    INITIAL_CLAIM_ALLOWANCE_FORM_DATA,
  );
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Hub-specific state
  const [selectedHub, setSelectedHub] = useState<HubType>(null);
  const [cappedTransferHubFormData, setCappedTransferHubFormData] = useState<CappedTransferHubFormData>(
    INITIAL_CAPPED_TRANSFER_HUB_FORM_DATA,
  );
  const [isHubReviewMode, setIsHubReviewMode] = useState(false);

  // Hub child deployment state
  const [hubChildFormData, setHubChildFormData] = useState<HubChildFormData>(INITIAL_HUB_CHILD_FORM_DATA);
  const [isHubChildReviewMode, setIsHubChildReviewMode] = useState(false);
  const [hubInfo, setHubInfo] = useState<CappedTokenTransfersHubInfo | null>(null);
  const [isLoadingHubInfo, setIsLoadingHubInfo] = useState(false);
  const [hubLabel, setHubLabel] = useState<string>("");
  const [hubIsFastPath, setHubIsFastPath] = useState(false);

  // Signing flow state
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reviewCheckboxState, setReviewCheckboxState] = useState({
    proposeTransaction: false,
    proposePreApproval: false,
    approvalDurationSeconds: undefined as bigint | undefined,
  });

  // Store the deployed action builder address for subsequent steps
  const [deployedActionAddress, setDeployedActionAddress] = useState<Address | null>(null);

  // Store the deployed pre-approval action address for queue/sign steps
  const [preApprovalAddress, setPreApprovalAddress] = useState<Address | null>(null);

  // Track if turn-off-emergency flow has been initialized
  const [emergencyFlowInitialized, setEmergencyFlowInitialized] = useState(false);

  // Track if WalletConnect transaction has been processed
  const walletConnectProcessed = useRef(false);

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

  const path = location.pathname;

  // Reset all state
  const resetFlow = () => {
    setSelectedFactory(null);
    setTransferFormData(INITIAL_TRANSFER_FORM_DATA);
    setArbitraryActionFormData(INITIAL_ARBITRARY_ACTION_FORM_DATA);
    setClaimAllowanceFormData(INITIAL_CLAIM_ALLOWANCE_FORM_DATA);
    setIsReviewMode(false);
    setIsSigningMode(false);
    setTransactionSteps([]);
    setCurrentStepIndex(0);
    setReviewCheckboxState({
      proposeTransaction: false,
      proposePreApproval: false,
      approvalDurationSeconds: undefined,
    });
    setDeployedActionAddress(null);
    setPreApprovalAddress(null);
    setEmergencyFlowInitialized(false);
    setNonceDataLoaded(false);
    setCurrentSafeNonce(0);
    setQueueItems([]);
    // Reset hub state
    setSelectedHub(null);
    setCappedTransferHubFormData(INITIAL_CAPPED_TRANSFER_HUB_FORM_DATA);
    setIsHubReviewMode(false);
    // Reset hub child state
    setHubChildFormData(INITIAL_HUB_CHILD_FORM_DATA);
    setIsHubChildReviewMode(false);
    setHubInfo(null);
    setIsLoadingHubInfo(false);
    setHubLabel("");
    setHubIsFastPath(false);
    resetExecutor();
  };

  // Fetch nonce data when entering signing mode
  useEffect(() => {
    const fetchNonceData = async () => {
      if (!isSigningMode || !guardAddress || !safeAddress || nonceDataLoaded) {
        return;
      }

      try {
        console.log("[NewActionSection] Fetching nonce data for signing flow");

        // Fetch current nonce and queue items in parallel
        const [nonce, items] = await Promise.all([
          queueService.getCurrentSafeNonce(guardAddress as Address),
          queueService.getQueueItems(guardAddress as Address, safeAddress as Address),
        ]);

        console.log("[NewActionSection] Nonce data loaded:", { nonce, queueItemsCount: items.length });
        setCurrentSafeNonce(nonce);
        setQueueItems(items);
        setNonceDataLoaded(true);
      } catch (error) {
        console.error("[NewActionSection] Failed to fetch nonce data:", error);
        // Set defaults on error to avoid blocking
        setCurrentSafeNonce(0);
        setQueueItems([]);
        setNonceDataLoaded(true);
      }
    };

    fetchNonceData();
  }, [isSigningMode, guardAddress, safeAddress, queueService, nonceDataLoaded]);

  // Build steps for Turn Off Emergency Mode (2 steps: Queue + Sign)
  const buildTurnOffEmergencySteps = useCallback((): TransactionStep[] => {
    const steps: TransactionStep[] = [];

    // Step 1: Queue the UnsetEmergencyModeAction
    const queueData = encodeFunctionData({
      abi: canonGuardAbi,
      functionName: "queueTransaction",
      args: [UNSET_EMERGENCY_MODE_ACTION],
    });

    steps.push({
      id: "queue-emergency-off",
      title: "Queue Transaction",
      description: "Queue the Turn Off Emergency Mode action in Canon Guard",
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
      id: "sign-emergency-off",
      title: "Sign Transaction",
      description: "Approve the transaction hash in the Safe",
      status: "pending",
      to: safeAddress as Address,
      data: signData,
    });

    return steps;
  }, [guardAddress, safeAddress]);

  // Fetch hub info when on hub-child path
  useEffect(() => {
    const isHubChildPath = path.startsWith("/create/hub-child/");
    if (isHubChildPath && hubAddressParam && !hubInfo && !isLoadingHubInfo) {
      const fetchHubInfo = async () => {
        setIsLoadingHubInfo(true);
        try {
          const registryService = new RegistryService(clientService);
          const info = await registryService.getHubConfiguration(hubAddressParam as Address);
          setHubInfo(info);
          // Get hub label and fast path status from location state if available
          const state = location.state as { hubLabel?: string; isFastPath?: boolean } | null;
          if (state?.hubLabel) {
            setHubLabel(state.hubLabel);
          }
          if (state?.isFastPath !== undefined) {
            setHubIsFastPath(state.isFastPath);
          }
        } catch (error) {
          console.error("[NewActionSection] Failed to fetch hub info:", error);
        } finally {
          setIsLoadingHubInfo(false);
        }
      };
      fetchHubInfo();
    }
  }, [path, hubAddressParam, hubInfo, isLoadingHubInfo, clientService, location.state]);

  // Initialize turn-off-emergency flow when navigating directly to the path
  useEffect(() => {
    const isTurnOffPath =
      path === "/create/action/turn-off-emergency" || path.startsWith("/create/action/turn-off-emergency");
    const shouldInit = isTurnOffPath && !emergencyFlowInitialized && guardAddress && safeAddress;

    if (shouldInit) {
      const steps = buildTurnOffEmergencySteps();
      setTransactionSteps(steps);
      setCurrentStepIndex(0);
      setIsSigningMode(true);
      setEmergencyFlowInitialized(true);
    }
    // Reset initialization flag when leaving the path
    if (!isTurnOffPath && emergencyFlowInitialized) {
      setEmergencyFlowInitialized(false);
    }
  }, [path, emergencyFlowInitialized, guardAddress, safeAddress, buildTurnOffEmergencySteps]);

  // Handle WalletConnect transaction - pre-fill form and go directly to signing
  useEffect(() => {
    const state = location.state as { walletConnectTx?: ParsedWalletConnectTransaction } | null;
    const wcTx = state?.walletConnectTx;

    // Only process once and only on arbitrary-action path
    if (!wcTx || walletConnectProcessed.current || path !== "/create/action/arbitrary-action") {
      return;
    }

    // Only process if we have the required addresses
    if (!safeAddress || !guardAddress) {
      return;
    }

    walletConnectProcessed.current = true;

    // Parse value - WalletConnect sends hex values like "0x0"
    let parsedValue = "";
    if (wcTx.value && wcTx.value !== "0" && wcTx.value !== "0x0") {
      try {
        // Convert hex to decimal string
        parsedValue = BigInt(wcTx.value).toString();
      } catch {
        parsedValue = wcTx.value;
      }
    }

    // Pre-fill the form data - use full calldata directly
    const prefilledData: ArbitraryActionFormData = {
      title: `WalletConnect: ${wcTx.dappName || "Unknown App"}`,
      actions: [
        {
          target: wcTx.target,
          signature: "", // Signature is now optional
          data: wcTx.data.startsWith("0x") ? wcTx.data : `0x${wcTx.data}`, // Full calldata with selector
          value: parsedValue,
        },
      ],
    };

    setArbitraryActionFormData(prefilledData);
    setSelectedFactory("arbitrary-action");

    // Always go directly to signing flow
    // Build steps and start signing flow - skip registry for WalletConnect transactions
    const { steps } = buildArbitraryActionSteps({
      formData: prefilledData,
      safeAddress: safeAddress as Address,
      guardAddress: guardAddress as Address,
      proposeTransaction: true,
      proposePreApproval: false,
      approvalDurationSeconds: undefined,
      skipRegistry: true, // Don't save WalletConnect transactions to Canon List
    });

    console.log("[NewActionSection] WalletConnect tx - going directly to signing flow");

    setReviewCheckboxState({
      proposeTransaction: true,
      proposePreApproval: false,
      approvalDurationSeconds: undefined,
    });
    setTransactionSteps(steps);
    setCurrentStepIndex(0);
    setIsSigningMode(true);

    // Clear the location state to prevent re-processing on navigation
    window.history.replaceState({}, document.title);
  }, [location.state, path, safeAddress, guardAddress]);

  // Handle factory selection
  const handleSelectFactory = (factory: FactoryType) => {
    setSelectedFactory(factory);
    if (factory === "transfer") {
      navigateWithParams("/create/action/transfer");
    } else if (factory === "arbitrary-action") {
      navigateWithParams("/create/action/arbitrary-action");
    } else if (factory === "claim-allowance") {
      navigateWithParams("/create/action/claim-allowance");
    }
  };

  // Navigate back to factory selection
  const handleBackToFactory = () => {
    setSelectedFactory(null);
    setIsReviewMode(false);
    navigateWithParams("/create/action");
  };

  // Navigate back to transfer form from review
  const handleBackToForm = () => {
    setIsReviewMode(false);
  };

  // Go to review step (Transfer)
  const handleTransferFormContinue = () => {
    setSelectedFactory("transfer");
    setIsReviewMode(true);
  };

  // Go to review step (Arbitrary Action)
  const handleArbitraryActionFormContinue = () => {
    setSelectedFactory("arbitrary-action");
    setIsReviewMode(true);
  };

  // Go to review step (Claim Allowance)
  const handleClaimAllowanceFormContinue = () => {
    setSelectedFactory("claim-allowance");
    setIsReviewMode(true);
  };

  // Navigate back to main create page
  const handleNavigateToCreate = () => {
    resetFlow();
    navigateWithParams("/create");
  };

  // Change factory
  const handleChangeFactory = () => {
    setIsReviewMode(false);
    navigateWithParams("/create/action");
  };

  // Handle initiate action (deployment) - starts signing flow (Transfer)
  const handleInitiate = (
    proposeTransaction: boolean,
    proposePreApproval: boolean,
    approvalDurationSeconds?: bigint,
  ) => {
    if (!safeAddress || !guardAddress) {
      console.error("Missing safeAddress or guardAddress");
      return;
    }

    // Build transaction steps based on checkbox selections
    const { steps } = buildTransactionSteps({
      formData: transferFormData,
      safeAddress: safeAddress as Address,
      guardAddress: guardAddress as Address,
      proposeTransaction,
      proposePreApproval,
      approvalDurationSeconds,
    });

    // Store checkbox state for reference (including duration)
    setReviewCheckboxState({ proposeTransaction, proposePreApproval, approvalDurationSeconds });

    // Set up signing flow
    setTransactionSteps(steps);
    setCurrentStepIndex(0);
    setIsSigningMode(true);
  };

  // Handle initiate Arbitrary Action - starts signing flow
  const handleInitiateArbitraryAction = (
    proposeTransaction: boolean,
    proposePreApproval: boolean,
    approvalDurationSeconds?: bigint,
  ) => {
    if (!safeAddress || !guardAddress) {
      console.error("Missing safeAddress or guardAddress");
      return;
    }

    const { steps } = buildArbitraryActionSteps({
      formData: arbitraryActionFormData,
      safeAddress: safeAddress as Address,
      guardAddress: guardAddress as Address,
      proposeTransaction,
      proposePreApproval,
      approvalDurationSeconds,
    });

    setReviewCheckboxState({ proposeTransaction, proposePreApproval, approvalDurationSeconds });
    setTransactionSteps(steps);
    setCurrentStepIndex(0);
    setIsSigningMode(true);
  };

  // Handle initiate Claim Allowance - starts signing flow
  const handleInitiateClaimAllowance = (
    proposeTransaction: boolean,
    proposePreApproval: boolean,
    approvalDurationSeconds?: bigint,
  ) => {
    if (!safeAddress || !guardAddress) {
      console.error("Missing safeAddress or guardAddress");
      return;
    }

    const { steps } = buildClaimAllowanceSteps({
      formData: claimAllowanceFormData,
      safeAddress: safeAddress as Address,
      guardAddress: guardAddress as Address,
      proposeTransaction,
      proposePreApproval,
      approvalDurationSeconds,
    });

    setReviewCheckboxState({ proposeTransaction, proposePreApproval, approvalDurationSeconds });
    setTransactionSteps(steps);
    setCurrentStepIndex(0);
    setIsSigningMode(true);
  };

  // Handle edit from review
  const handleEdit = () => {
    setIsReviewMode(false);
  };

  // =====================================================
  // Hub-specific handlers
  // =====================================================

  // Handle hub selection
  const handleSelectHub = (hub: HubType) => {
    setSelectedHub(hub);
    if (hub === "capped-transfer-hub") {
      navigateWithParams("/create/hub/capped-transfer");
    }
  };

  // Navigate back to hub selection
  const handleBackToHubSelection = () => {
    setSelectedHub(null);
    setIsHubReviewMode(false);
    navigateWithParams("/create/hub");
  };

  // Navigate back to hub form from review
  const handleBackToHubForm = () => {
    setIsHubReviewMode(false);
  };

  // Go to review step (Capped Transfer Hub)
  const handleCappedTransferHubFormContinue = () => {
    setSelectedHub("capped-transfer-hub");
    setIsHubReviewMode(true);
  };

  // Change hub type
  const handleChangeHub = () => {
    setIsHubReviewMode(false);
    navigateWithParams("/create/hub");
  };

  // Handle edit from hub review
  const handleHubEdit = () => {
    setIsHubReviewMode(false);
  };

  // Handle initiate Capped Transfer Hub - starts signing flow
  const handleInitiateCappedTransferHub = (proposePreApproval: boolean, approvalDurationSeconds?: bigint) => {
    if (!safeAddress || !guardAddress) {
      console.error("Missing safeAddress or guardAddress");
      return;
    }

    const { steps } = buildCappedTransferHubSteps({
      formData: cappedTransferHubFormData,
      safeAddress: safeAddress as Address,
      guardAddress: guardAddress as Address,
      proposePreApproval,
      approvalDurationSeconds,
    });

    setReviewCheckboxState({ proposeTransaction: false, proposePreApproval, approvalDurationSeconds });
    setTransactionSteps(steps);
    setCurrentStepIndex(0);
    setIsSigningMode(true);
  };

  // =====================================================
  // Hub Child handlers
  // =====================================================

  // Navigate back to Canon List from hub child form
  const handleBackFromHubChild = () => {
    navigateWithParams("/canon-list");
  };

  // Navigate back to hub child form from review
  const handleBackToHubChildForm = () => {
    setIsHubChildReviewMode(false);
  };

  // Go to review step (Hub Child)
  const handleHubChildFormContinue = () => {
    setIsHubChildReviewMode(true);
  };

  // Handle edit from hub child review
  const handleHubChildEdit = () => {
    setIsHubChildReviewMode(false);
  };

  // Handle initiate Hub Child deployment - starts signing flow
  const handleInitiateHubChild = (proposeTransaction: boolean) => {
    if (!safeAddress || !guardAddress || !hubAddressParam) {
      console.error("Missing safeAddress, guardAddress, or hubAddress");
      return;
    }

    const { steps } = buildDeployHubChildSteps({
      formData: hubChildFormData,
      hubAddress: hubAddressParam as Address,
      safeAddress: safeAddress as Address,
      guardAddress: guardAddress as Address,
      proposeTransaction,
    });

    setReviewCheckboxState({ proposeTransaction, proposePreApproval: false, approvalDurationSeconds: undefined });
    setTransactionSteps(steps);
    setCurrentStepIndex(0);
    setIsSigningMode(true);
  };

  // Handle back from signing flow
  const handleBackFromSigning = () => {
    setIsSigningMode(false);
    setTransactionSteps([]);
    setCurrentStepIndex(0);
    setDeployedActionAddress(null);
    setPreApprovalAddress(null);
    resetExecutor();
  };

  /**
   * Execute the current transaction step
   * For the Deploy step, this calls the real contract
   * For subsequent steps, this uses a mock (to be implemented later)
   *
   * @param nonce - Optional nonce to use for signing (passed from NonceSelector)
   */
  const handleExecuteStep = useCallback(
    async (nonce?: number) => {
      if (currentStepIndex >= transactionSteps.length) return;

      // Capture the step index at call time to avoid stale closure issues
      const stepIndex = currentStepIndex;
      const currentStep = transactionSteps[stepIndex];

      // Set current step to "waiting" (user will see wallet popup)
      setTransactionSteps((prev) => {
        const updated = [...prev];
        updated[stepIndex] = { ...updated[stepIndex], status: "waiting" };
        return updated;
      });

      // Handle the Deploy Contract step for Transfer (first step)
      if (currentStep.id === "deploy-action") {
        console.log("[handleExecuteStep] Executing deploy-action step");
        const result = await executeDeployTransfer(transferFormData);
        console.log("[handleExecuteStep] Deploy result:", result);

        if (result) {
          // Success - store deployed address and mark step as signed
          setDeployedActionAddress(result.deployedAddress);
          console.log("[handleExecuteStep] Action deployed at:", result.deployedAddress);
          console.log("[handleExecuteStep] Transaction hash:", result.txHash);
          console.log("[handleExecuteStep] Updating step", stepIndex, "to signed and advancing to", stepIndex + 1);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            // Set next step to pending
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            console.log(
              "[handleExecuteStep] Updated steps:",
              updated.map((s) => ({ id: s.id, status: s.status })),
            );
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
          console.log("[handleExecuteStep] setCurrentStepIndex called with:", stepIndex + 1);
        } else {
          // Failed - revert to error status
          console.log("[handleExecuteStep] Deploy failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Deploy Contract step for Arbitrary Action
      if (currentStep.id === "deploy-arbitrary-action") {
        console.log("[handleExecuteStep] Executing deploy-arbitrary-action step");
        const result = await executeDeployArbitraryAction(arbitraryActionFormData);
        console.log("[handleExecuteStep] Deploy ArbitraryAction result:", result);

        if (result) {
          setDeployedActionAddress(result.deployedAddress);
          console.log("[handleExecuteStep] ArbitraryAction deployed at:", result.deployedAddress);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Deploy ArbitraryAction failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Deploy Contract step for Claim Allowance
      if (currentStep.id === "deploy-claim-allowance") {
        console.log("[handleExecuteStep] Executing deploy-claim-allowance step");
        const result = await executeDeployClaimAllowance(claimAllowanceFormData);
        console.log("[handleExecuteStep] Deploy ClaimAllowance result:", result);

        if (result) {
          setDeployedActionAddress(result.deployedAddress);
          console.log("[handleExecuteStep] ClaimAllowance deployed at:", result.deployedAddress);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Deploy ClaimAllowance failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Deploy Hub step for Capped Token Transfers Hub
      if (currentStep.id === "deploy-capped-transfer-hub") {
        console.log("[handleExecuteStep] Executing deploy-capped-transfer-hub step");
        const result = await executeDeployCappedTransferHub(cappedTransferHubFormData, safeAddress as Address);
        console.log("[handleExecuteStep] Deploy CappedTransferHub result:", result);

        if (result) {
          setDeployedActionAddress(result.deployedAddress);
          console.log("[handleExecuteStep] CappedTransferHub deployed at:", result.deployedAddress);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Deploy CappedTransferHub failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Deploy Hub Child step
      if (currentStep.id === "deploy-hub-child") {
        console.log("[handleExecuteStep] Executing deploy-hub-child step");
        if (!hubAddressParam) {
          console.error("[handleExecuteStep] Missing hubAddress for hub child deploy");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeDeployHubChild(hubAddressParam as Address, hubChildFormData);
        console.log("[handleExecuteStep] Deploy Hub Child result:", result);

        if (result) {
          setDeployedActionAddress(result.deployedAddress);
          console.log("[handleExecuteStep] Hub Child deployed at:", result.deployedAddress);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Deploy Hub Child failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Save to Registry step (second step)
      if (currentStep.id === "record-registry") {
        console.log("[handleExecuteStep] Executing record-registry step");

        if (!guardAddress || !deployedActionAddress) {
          console.error("[handleExecuteStep] Missing guardAddress or deployedActionAddress for registry step");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        // Get label from the appropriate form data based on selected factory or hub
        let label: string;
        if (path.startsWith("/create/hub-child/")) {
          label = hubChildFormData.title || "Untitled Transfer";
        } else if (selectedHub === "capped-transfer-hub") {
          label = cappedTransferHubFormData.title || "Untitled Hub";
        } else if (selectedFactory === "arbitrary-action") {
          label = arbitraryActionFormData.title || "Untitled Arbitrary Action";
        } else if (selectedFactory === "claim-allowance") {
          label = claimAllowanceFormData.title || "Untitled Claim Allowance";
        } else {
          label = transferFormData.title || "Untitled Transfer";
        }
        const result = await executeRecordToRegistry(guardAddress as Address, deployedActionAddress, label);
        console.log("[handleExecuteStep] Registry result:", result);

        if (result) {
          console.log("[handleExecuteStep] Registered to registry with hash:", result.txHash);
          console.log("[handleExecuteStep] Updating step", stepIndex, "to signed and advancing to", stepIndex + 1);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            console.log(
              "[handleExecuteStep] Updated steps:",
              updated.map((s) => ({ id: s.id, status: s.status })),
            );
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
          console.log("[handleExecuteStep] setCurrentStepIndex called with:", stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Registry record failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Queue Transaction step (for the main action)
      if (currentStep.id === "queue-action") {
        console.log("[handleExecuteStep] Executing queue-action step");

        if (!guardAddress || !deployedActionAddress) {
          console.error("[handleExecuteStep] Missing guardAddress or deployedActionAddress for queue step");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeQueueTransaction(guardAddress as Address, deployedActionAddress);
        console.log("[handleExecuteStep] Queue result:", result);

        if (result) {
          console.log("[handleExecuteStep] Queued with hash:", result.txHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Queue failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Sign Transaction step (for the main action)
      if (currentStep.id === "sign-safe-tx") {
        console.log("[handleExecuteStep] Executing sign-safe-tx step");

        if (!safeAddress || !guardAddress || !deployedActionAddress) {
          console.error("[handleExecuteStep] Missing addresses for sign step");
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
        console.log("[handleExecuteStep] Sign result:", result, "nonce:", nonce);

        if (result) {
          console.log("[handleExecuteStep] Signed with safeTxHash:", result.safeTxHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
          // Notify that queue count may have changed
          onQueueCountChange?.();
        } else {
          console.log("[handleExecuteStep] Sign failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Deploy Pre-Approval step
      if (currentStep.id === "deploy-preapprove") {
        console.log("[handleExecuteStep] Executing deploy-preapprove step");

        if (!deployedActionAddress || !reviewCheckboxState.approvalDurationSeconds) {
          console.error(
            "[handleExecuteStep] Missing deployedActionAddress or approvalDuration for pre-approval deploy",
          );
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeDeployPreApproval(
          deployedActionAddress,
          reviewCheckboxState.approvalDurationSeconds,
        );
        console.log("[handleExecuteStep] Deploy pre-approval result:", result);

        if (result) {
          // Store the pre-approval address for subsequent queue/sign steps
          setPreApprovalAddress(result.preApprovalAddress);
          console.log("[handleExecuteStep] Pre-approval deployed at:", result.preApprovalAddress);

          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Deploy pre-approval failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Queue Pre-Approval step
      if (currentStep.id === "queue-preapprove") {
        console.log("[handleExecuteStep] Executing queue-preapprove step");

        if (!guardAddress || !preApprovalAddress) {
          console.error("[handleExecuteStep] Missing guardAddress or preApprovalAddress for pre-approval queue");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeQueueTransaction(guardAddress as Address, preApprovalAddress);
        console.log("[handleExecuteStep] Queue pre-approval result:", result);

        if (result) {
          console.log("[handleExecuteStep] Pre-approval queued with hash:", result.txHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Queue pre-approval failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Sign Pre-Approval step
      if (currentStep.id === "sign-preapprove") {
        console.log("[handleExecuteStep] Executing sign-preapprove step");

        if (!safeAddress || !guardAddress || !preApprovalAddress) {
          console.error("[handleExecuteStep] Missing addresses for pre-approval sign step");
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
          preApprovalAddress,
          nonce,
        );
        console.log("[handleExecuteStep] Sign pre-approval result:", result, "nonce:", nonce);

        if (result) {
          console.log("[handleExecuteStep] Pre-approval signed with safeTxHash:", result.safeTxHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
          // Notify that queue count may have changed
          onQueueCountChange?.();
        } else {
          console.log("[handleExecuteStep] Sign pre-approval failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Queue Emergency Off step (Turn Off Emergency Mode flow)
      if (currentStep.id === "queue-emergency-off") {
        console.log("[handleExecuteStep] Executing queue-emergency-off step");

        if (!guardAddress) {
          console.error("[handleExecuteStep] Missing guardAddress for queue step");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
          return;
        }

        const result = await executeQueueTransaction(guardAddress as Address, UNSET_EMERGENCY_MODE_ACTION);
        console.log("[handleExecuteStep] Queue emergency off result:", result);

        if (result) {
          console.log("[handleExecuteStep] Queued emergency off with hash:", result.txHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
        } else {
          console.log("[handleExecuteStep] Queue emergency off failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Handle the Sign Emergency Off step (Turn Off Emergency Mode flow)
      if (currentStep.id === "sign-emergency-off") {
        console.log("[handleExecuteStep] Executing sign-emergency-off step");

        if (!safeAddress || !guardAddress) {
          console.error("[handleExecuteStep] Missing addresses for sign step");
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
          UNSET_EMERGENCY_MODE_ACTION,
          nonce,
        );
        console.log("[handleExecuteStep] Sign emergency off result:", result, "nonce:", nonce);

        if (result) {
          console.log("[handleExecuteStep] Emergency off signed with safeTxHash:", result.safeTxHash);
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "signed" };
            if (stepIndex + 1 < updated.length) {
              updated[stepIndex + 1] = { ...updated[stepIndex + 1], status: "pending" };
            }
            return updated;
          });
          setCurrentStepIndex(stepIndex + 1);
          // Notify that queue count may have changed
          onQueueCountChange?.();
        } else {
          console.log("[handleExecuteStep] Sign emergency off failed, setting error status");
          setTransactionSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = { ...updated[stepIndex], status: "error" };
            return updated;
          });
        }
        return;
      }

      // Fallback for unknown step IDs (shouldn't happen in normal usage)
      console.error("[handleExecuteStep] Unknown step ID:", currentStep.id);
      setTransactionSteps((prev) => {
        const updated = [...prev];
        updated[stepIndex] = { ...updated[stepIndex], status: "error" };
        return updated;
      });
    },
    [
      currentStepIndex,
      transactionSteps,
      selectedFactory,
      selectedHub,
      transferFormData,
      arbitraryActionFormData,
      claimAllowanceFormData,
      cappedTransferHubFormData,
      hubChildFormData,
      hubAddressParam,
      executeDeployTransfer,
      executeDeployArbitraryAction,
      executeDeployClaimAllowance,
      executeDeployHubChild,
      executeDeployCappedTransferHub,
      executeRecordToRegistry,
      executeQueueTransaction,
      executeSignTransaction,
      executeDeployPreApproval,
      guardAddress,
      safeAddress,
      deployedActionAddress,
      preApprovalAddress,
      reviewCheckboxState.approvalDurationSeconds,
      onQueueCountChange,
    ],
  );

  // Check if signing is complete
  const isSigningComplete = transactionSteps.length > 0 && transactionSteps.every((s) => s.status === "signed");

  // /create/action -> Select Factory
  if (path === "/create/action") {
    return <SelectFactoryStep onSelectFactory={handleSelectFactory} onNavigateToCreate={handleNavigateToCreate} />;
  }

  // /create/action/transfer -> Transfer Form, Review, or Signing
  if (path === "/create/action/transfer") {
    // Show signing flow if in signing mode
    if (isSigningMode) {
      return (
        <SigningFlowStep
          steps={transactionSteps}
          currentStepIndex={currentStepIndex}
          formData={transferFormData}
          onBack={handleBackFromSigning}
          onNavigateToCreate={handleNavigateToCreate}
          onSimulateSign={handleExecuteStep}
          isComplete={isSigningComplete}
          nonceSelectionEnabled={nonceDataLoaded}
          currentSafeNonce={currentSafeNonce}
          queueItems={queueItems}
        />
      );
    }

    // Show review step
    if (isReviewMode) {
      return (
        <ReviewDeployStep
          formData={transferFormData}
          guardAddress={guardAddress as Address}
          chainId={chainId as number}
          onBack={handleBackToForm}
          onInitiate={handleInitiate}
          onNavigateToCreate={handleNavigateToCreate}
          onEdit={handleEdit}
        />
      );
    }

    // Show transfer form
    return (
      <TransferFormStep
        formData={transferFormData}
        onFormDataChange={setTransferFormData}
        onContinue={handleTransferFormContinue}
        onBack={handleBackToFactory}
        onNavigateToCreate={handleNavigateToCreate}
        onChangeFactory={handleChangeFactory}
      />
    );
  }

  // /create/action/arbitrary-action -> Arbitrary Action Form, Review, or Signing
  if (path === "/create/action/arbitrary-action") {
    // Show signing flow if in signing mode
    if (isSigningMode) {
      return (
        <SigningFlowStep
          steps={transactionSteps}
          currentStepIndex={currentStepIndex}
          formData={arbitraryActionFormData}
          onBack={handleBackFromSigning}
          onNavigateToCreate={handleNavigateToCreate}
          onSimulateSign={handleExecuteStep}
          isComplete={isSigningComplete}
          actionTitle={arbitraryActionFormData.title || "Arbitrary Action"}
          factoryType={FACTORY_DISPLAY_NAMES[ActionFactoryType.ARBITRARY_ACTIONS]!}
          nonceSelectionEnabled={nonceDataLoaded}
          currentSafeNonce={currentSafeNonce}
          queueItems={queueItems}
        />
      );
    }

    // Show review step
    if (isReviewMode) {
      return (
        <ReviewDeployStep
          formData={arbitraryActionFormData}
          guardAddress={guardAddress as Address}
          chainId={chainId as number}
          onBack={handleBackToForm}
          onInitiate={handleInitiateArbitraryAction}
          onNavigateToCreate={handleNavigateToCreate}
          onEdit={handleEdit}
        />
      );
    }

    // Show arbitrary action form
    return (
      <ArbitraryActionFormStep
        formData={arbitraryActionFormData}
        onFormDataChange={setArbitraryActionFormData}
        onContinue={handleArbitraryActionFormContinue}
        onBack={handleBackToFactory}
        onNavigateToCreate={handleNavigateToCreate}
        onChangeFactory={handleChangeFactory}
      />
    );
  }

  // /create/action/claim-allowance -> Claim Allowance Form, Review, or Signing
  if (path === "/create/action/claim-allowance") {
    // Show signing flow if in signing mode
    if (isSigningMode) {
      return (
        <SigningFlowStep
          steps={transactionSteps}
          currentStepIndex={currentStepIndex}
          formData={claimAllowanceFormData}
          onBack={handleBackFromSigning}
          onNavigateToCreate={handleNavigateToCreate}
          onSimulateSign={handleExecuteStep}
          isComplete={isSigningComplete}
          actionTitle={claimAllowanceFormData.title || "Claim Allowance"}
          factoryType={FACTORY_DISPLAY_NAMES[ActionFactoryType.ALLOWANCE_CLAIMOR]!}
          nonceSelectionEnabled={nonceDataLoaded}
          currentSafeNonce={currentSafeNonce}
          queueItems={queueItems}
        />
      );
    }

    // Show review step
    if (isReviewMode) {
      return (
        <ReviewDeployStep
          formData={claimAllowanceFormData}
          guardAddress={guardAddress as Address}
          chainId={chainId as number}
          onBack={handleBackToForm}
          onInitiate={handleInitiateClaimAllowance}
          onNavigateToCreate={handleNavigateToCreate}
          onEdit={handleEdit}
        />
      );
    }

    // Show claim allowance form
    return (
      <ClaimAllowanceFormStep
        formData={claimAllowanceFormData}
        onFormDataChange={setClaimAllowanceFormData}
        onContinue={handleClaimAllowanceFormContinue}
        onBack={handleBackToFactory}
        onNavigateToCreate={handleNavigateToCreate}
        onChangeFactory={handleChangeFactory}
      />
    );
  }

  // /create/action/turn-off-emergency -> Signing Flow only (no form)
  const isTurnOffEmergencyPath =
    path === "/create/action/turn-off-emergency" || path.startsWith("/create/action/turn-off-emergency");

  if (isTurnOffEmergencyPath) {
    // Wait for initialization to complete (useEffect will set up the steps)
    if (!emergencyFlowInitialized || transactionSteps.length === 0) {
      // Show loading state while initializing
      return (
        <LoadingContainer>
          <LoadingText>Initializing Turn Off Emergency Mode...</LoadingText>
        </LoadingContainer>
      );
    }

    return (
      <SigningFlowStep
        steps={transactionSteps}
        currentStepIndex={currentStepIndex}
        onBack={handleBackToFactory}
        onNavigateToCreate={handleNavigateToCreate}
        onSimulateSign={handleExecuteStep}
        isComplete={isSigningComplete}
        actionTitle='Turn Off Emergency Mode'
        factoryType='EMERGENCY'
        hideParameters={true}
        breadcrumbPage='Emergency Mode'
        breadcrumbStandalone={true}
        nonceSelectionEnabled={nonceDataLoaded}
        currentSafeNonce={currentSafeNonce}
        queueItems={queueItems}
      />
    );
  }

  // =====================================================
  // Hub Routes
  // =====================================================

  // /create/hub -> Select Hub Type
  if (path === "/create/hub") {
    return <SelectHubTypeStep onSelectHub={handleSelectHub} onNavigateToCreate={handleNavigateToCreate} />;
  }

  // /create/hub/capped-transfer -> Capped Transfer Hub Form, Review, or Signing
  if (path === "/create/hub/capped-transfer") {
    // Show signing flow if in signing mode
    if (isSigningMode) {
      return (
        <SigningFlowStep
          steps={transactionSteps}
          currentStepIndex={currentStepIndex}
          formData={cappedTransferHubFormData}
          onBack={handleBackFromSigning}
          onNavigateToCreate={handleNavigateToCreate}
          onSimulateSign={handleExecuteStep}
          isComplete={isSigningComplete}
          actionTitle={cappedTransferHubFormData.title || "Capped Transfer Hub"}
          factoryType={`HUB: ${HUB_DISPLAY_NAMES[ActionFactoryType.CAPPED_TOKEN_TRANSFERS]}`}
          nonceSelectionEnabled={nonceDataLoaded}
          currentSafeNonce={currentSafeNonce}
          queueItems={queueItems}
        />
      );
    }

    // Show review step
    if (isHubReviewMode) {
      return (
        <HubReviewStep
          formData={cappedTransferHubFormData}
          guardAddress={guardAddress as Address}
          chainId={chainId as number}
          onBack={handleBackToHubForm}
          onInitiate={handleInitiateCappedTransferHub}
          onNavigateToCreate={handleNavigateToCreate}
          onEdit={handleHubEdit}
        />
      );
    }

    // Show capped transfer hub form
    return (
      <CappedTransferHubFormStep
        formData={cappedTransferHubFormData}
        onFormDataChange={setCappedTransferHubFormData}
        onContinue={handleCappedTransferHubFormContinue}
        onBack={handleBackToHubSelection}
        onNavigateToCreate={handleNavigateToCreate}
        onChangeHub={handleChangeHub}
      />
    );
  }

  // /create/hub-child/:hubAddress -> Deploy Hub Child Form, Review, or Signing
  if (path.startsWith("/create/hub-child/") && hubAddressParam) {
    // Show signing flow if in signing mode
    if (isSigningMode) {
      return (
        <SigningFlowStep
          steps={transactionSteps}
          currentStepIndex={currentStepIndex}
          formData={hubChildFormData}
          onBack={handleBackFromSigning}
          onNavigateToCreate={handleNavigateToCreate}
          onSimulateSign={handleExecuteStep}
          isComplete={isSigningComplete}
          actionTitle={hubChildFormData.title || "Hub Child Transfer"}
          factoryType='HUB: CAPPED TRANSFER'
          nonceSelectionEnabled={nonceDataLoaded}
          currentSafeNonce={currentSafeNonce}
          queueItems={queueItems}
        />
      );
    }

    // Show review step
    if (isHubChildReviewMode) {
      return (
        <DeployHubChildReviewStep
          hubAddress={hubAddressParam as Address}
          hubLabel={hubLabel || "Capped Transfer Hub"}
          hubInfo={hubInfo}
          isFastPath={hubIsFastPath}
          formData={hubChildFormData}
          onBack={handleBackToHubChildForm}
          onInitiate={handleInitiateHubChild}
          onNavigateToCreate={handleNavigateToCreate}
          onEdit={handleHubChildEdit}
        />
      );
    }

    // Show hub child form
    return (
      <DeployHubChildFormStep
        hubAddress={hubAddressParam as Address}
        hubLabel={hubLabel || "Capped Transfer Hub"}
        hubInfo={hubInfo}
        isLoadingHubInfo={isLoadingHubInfo}
        formData={hubChildFormData}
        onFormDataChange={setHubChildFormData}
        onContinue={handleHubChildFormContinue}
        onBack={handleBackFromHubChild}
        onNavigateToCreate={handleNavigateToCreate}
      />
    );
  }

  // Default: show factory selection
  return <SelectFactoryStep onSelectFactory={handleSelectFactory} onNavigateToCreate={handleNavigateToCreate} />;
};

// Styled components for loading state
const LoadingContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "64px",
  width: "100%",
});

const LoadingText = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
});
