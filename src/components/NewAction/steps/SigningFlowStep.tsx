import { useState, useCallback, useEffect } from "react";
import { Box, Typography, styled, keyframes, CircularProgress } from "@mui/material";
import { NonceSelector, calculateRecommendedNonce } from "~/components/NonceSelector";
import {
  CheckIcon,
  CheckCheckIcon,
  Loader2Icon,
  BoxIcon,
  PlusIcon,
  MinusIcon,
  CircleDashedIcon,
  ListIcon,
  XIcon,
} from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useWallet, useStateContext, useNavigateWithParams, useIsSigner } from "~/hooks";
import type { QueueItem } from "~/services/queueService";
import type { TransactionStep } from "~/services/transactionBuilderService";
import { Breadcrumb, ParametersDisplay } from "../shared";
import type { TransferFormData, ArbitraryActionFormData, CappedTransferHubFormData } from "./index";

interface SigningFlowStepProps {
  steps: TransactionStep[];
  currentStepIndex: number;
  formData?: TransferFormData | ArbitraryActionFormData | CappedTransferHubFormData;
  onBack: () => void;
  onNavigateToCreate: () => void;
  onSimulateSign: (nonce?: number) => void;
  isComplete: boolean;
  /** Custom title for the action (overrides formData.title) */
  actionTitle?: string;
  /** Custom factory type label (e.g., "TRANSFER", "ACTION") */
  factoryType?: string;
  /** If true, hides the parameters section */
  hideParameters?: boolean;
  /** Custom breadcrumb settings */
  breadcrumbPage?: string;
  breadcrumbStandalone?: boolean;
  /** Nonce selection props - if provided, enables nonce selection */
  nonceSelectionEnabled?: boolean;
  /** Current Safe nonce (required if nonceSelectionEnabled) */
  currentSafeNonce?: number;
  /** Queue items for nonce selection display */
  queueItems?: QueueItem[];
  /** If true, the nonce is locked (for items with existing signatures) */
  isNonceLocked?: boolean;
  /** Locked nonce value when isNonceLocked is true */
  lockedNonce?: number;
}

export const SigningFlowStep = ({
  steps,
  currentStepIndex,
  formData,
  onNavigateToCreate,
  onSimulateSign,
  isComplete,
  actionTitle,
  factoryType = "TRANSFER",
  hideParameters = false,
  breadcrumbPage = "New Action",
  breadcrumbStandalone = false,
  nonceSelectionEnabled = false,
  currentSafeNonce = 0,
  queueItems = [],
  isNonceLocked = false,
  lockedNonce,
}: SigningFlowStepProps) => {
  const [parametersExpanded, setParametersExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSigner = useIsSigner();
  const [isSigning, setIsSigning] = useState(false);

  // Nonce selection state
  const recommendedNonce = calculateRecommendedNonce(currentSafeNonce, queueItems);
  const [selectedNonce, setSelectedNonce] = useState<number>(
    isNonceLocked && lockedNonce !== undefined ? lockedNonce : recommendedNonce,
  );

  // Update selected nonce when recommended nonce changes (e.g., after initial load)
  useEffect(() => {
    if (!isNonceLocked && currentSafeNonce > 0) {
      setSelectedNonce(recommendedNonce);
    }
  }, [recommendedNonce, isNonceLocked, currentSafeNonce]);

  // Navigation hook for completion buttons
  const navigateWithParams = useNavigateWithParams();

  // Derive title from props or formData
  const displayTitle = actionTitle || formData?.title || "Untitled Action";

  // Wallet state for chain verification at signing time
  const { isConnected, connect, switchToChain, isOnCorrectChain, isSwitchingChain } = useWallet();
  const { chainId: appChainId } = useStateContext();

  const signedCount = steps.filter((s) => s.status === "signed").length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (signedCount / totalCount) * 100 : 0;

  const currentStep = steps[currentStepIndex];

  /**
   * Handle sign button click with wallet and chain verification
   * Only prompts for chain switch at signing time (not on connect)
   */
  const handleSignClick = useCallback(async () => {
    // Step 1: Check if wallet is connected
    if (!isConnected) {
      connect();
      return;
    }

    // Step 2: Check if on correct chain (only at signing time)
    if (appChainId && !isOnCorrectChain(appChainId)) {
      const switched = await switchToChain(appChainId);
      if (!switched) {
        // User rejected chain switch or error occurred
        return;
      }
    }

    // Step 3: Proceed with signing (pass nonce if selection is enabled)
    setIsSigning(true);
    try {
      if (nonceSelectionEnabled) {
        await onSimulateSign(selectedNonce);
      } else {
        await onSimulateSign();
      }
    } finally {
      setIsSigning(false);
    }
  }, [
    isConnected,
    connect,
    isOnCorrectChain,
    appChainId,
    switchToChain,
    onSimulateSign,
    nonceSelectionEnabled,
    selectedNonce,
  ]);

  // Format hash for display (2 lines)
  // Get transaction type label based on step id/title
  const getTransactionTypeLabel = (step: TransactionStep) => {
    const title = step.title.toLowerCase();
    if (title.includes("pre-approv") || title.includes("preapprov")) {
      return `Pre-Approval: ${step.title.replace(/pre-?approval:?\s*/i, "")}`;
    }
    return `Transaction: ${step.title}`;
  };

  if (isComplete) {
    return (
      <>
        {/* Slide-out Drawer */}
        <DrawerOverlay $isOpen={drawerOpen} onClick={() => setDrawerOpen(false)} />
        <DrawerPanel $isOpen={drawerOpen}>
          <DrawerHeader>
            <DrawerTitle>
              Signed {steps.length} / {steps.length}
            </DrawerTitle>
            <CloseButton onClick={() => setDrawerOpen(false)}>
              <XIcon size={16} color={canonHeaderTokens.foreground.accent10} />
            </CloseButton>
          </DrawerHeader>
          <DrawerContent>
            <DrawerActionInfo>
              <DrawerActionTitle>{displayTitle}</DrawerActionTitle>
              <DrawerFactoryInfo>
                <FactoryLabel>CANON FACTORY</FactoryLabel>
                <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                <FactoryLabel>{factoryType}</FactoryLabel>
              </DrawerFactoryInfo>
            </DrawerActionInfo>
            <DrawerTransactionList>
              {steps.map((step, index) => (
                <DrawerTransactionItem key={step.id}>
                  <StepNumberArea>
                    <StepNumberBadge>{index + 1}</StepNumberBadge>
                  </StepNumberArea>
                  <StepContentArea>
                    <DrawerStepIndicator $status='signed'>
                      <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />
                    </DrawerStepIndicator>
                    <DrawerTransactionLabelRow>
                      <DrawerTransactionLabelBold>
                        {step.title.includes("Pre-Approval") ? "Pre-Approval:" : "Transaction:"}
                      </DrawerTransactionLabelBold>
                      <DrawerTransactionLabelNormal>
                        {step.title.replace(/^(Pre-Approval|Transaction):\s*/, "").replace(/^Pre-Approval:\s*/, "")}
                      </DrawerTransactionLabelNormal>
                    </DrawerTransactionLabelRow>
                  </StepContentArea>
                </DrawerTransactionItem>
              ))}
            </DrawerTransactionList>
          </DrawerContent>
        </DrawerPanel>

        <Container>
          <ContentWrapper>
            {/* Breadcrumb */}
            <Breadcrumb
              onNavigateToCreate={onNavigateToCreate}
              currentPage={breadcrumbPage}
              standalone={breadcrumbStandalone}
            />

            {/* Action Preview Card */}
            <ActionPreviewCard>
              <PreviewHeader>
                <ActionTitle>{displayTitle}</ActionTitle>
                <FactoryInfo>
                  <FactoryLabel>CANON FACTORY</FactoryLabel>
                  <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <FactoryValue>{factoryType}</FactoryValue>
                </FactoryInfo>
              </PreviewHeader>
              {!hideParameters && (
                <ParametersToggle>
                  <ToggleContent>
                    <PlusIcon size={12} color={canonHeaderTokens.foreground.accent30} />
                    <ToggleLabel>PARAMETERS</ToggleLabel>
                  </ToggleContent>
                </ParametersToggle>
              )}
            </ActionPreviewCard>

            {/* Status Bar */}
            <StatusSection>
              <StatusBar>
                <StatusLeft>
                  <StatusLabel>STATUS</StatusLabel>
                  <StatusCount>
                    {steps.length}/{steps.length}
                  </StatusCount>
                  <ProgressBarContainer>
                    <ProgressBarFill style={{ width: "100%" }} $isComplete={true} />
                  </ProgressBarContainer>
                </StatusLeft>
                <ExpandButton onClick={() => setDrawerOpen(true)}>
                  <ListIcon size={20} color={canonHeaderTokens.foreground.accent20} />
                </ExpandButton>
              </StatusBar>
              <StatusShadow1 />
              <StatusShadow2 />
            </StatusSection>

            {/* Sign Transaction Section */}
            <SignTransactionSection>
              <SectionLabel>SIGN TRANSACTION</SectionLabel>
              <SuccessCardWrapper>
                <SuccessContent>
                  <SuccessIconWrapper>
                    <CheckCheckIcon size={24} color='#ffffff' />
                  </SuccessIconWrapper>
                  <SuccessTextContainer>
                    <SuccessTitle>Well done!</SuccessTitle>
                    <SuccessSubtext>All requests have been signed successfully.</SuccessSubtext>
                  </SuccessTextContainer>
                </SuccessContent>
                <SuccessButtonSection>
                  <SuccessButtonRow>
                    <OutlineButton
                      onClick={() => navigateWithParams("/canon-list")}
                      data-testid='view-canon-list-button'
                    >
                      VIEW CANON LIST
                    </OutlineButton>
                    <GreenButton onClick={() => navigateWithParams("/queue")} data-testid='view-queue-button'>
                      VIEW QUEUE
                    </GreenButton>
                  </SuccessButtonRow>
                </SuccessButtonSection>
              </SuccessCardWrapper>
            </SignTransactionSection>
          </ContentWrapper>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* Slide-out Drawer */}
      <DrawerOverlay $isOpen={drawerOpen} onClick={() => setDrawerOpen(false)} />
      <DrawerPanel $isOpen={drawerOpen}>
        <DrawerHeader>
          <DrawerTitle>
            Signed {signedCount} / {totalCount}
          </DrawerTitle>
          <CloseButton onClick={() => setDrawerOpen(false)}>
            <XIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          </CloseButton>
        </DrawerHeader>

        <DrawerContent>
          {/* Action Info */}
          <DrawerActionInfo>
            <DrawerActionTitle>{displayTitle}</DrawerActionTitle>
            <DrawerFactoryInfo>
              <FactoryLabel>CANON FACTORY</FactoryLabel>
              <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
              <FactoryValue>{factoryType}</FactoryValue>
            </DrawerFactoryInfo>
          </DrawerActionInfo>

          {/* Transaction List */}
          <DrawerTransactionList>
            {steps.map((step, index) => {
              const typeLabel = getTransactionTypeLabel(step);
              const colonIndex = typeLabel.indexOf(":");
              const prefix = colonIndex > -1 ? typeLabel.slice(0, colonIndex + 1) : "";
              const suffix = colonIndex > -1 ? typeLabel.slice(colonIndex + 1).trim() : typeLabel;
              const isCurrentStep = index === currentStepIndex;

              return (
                <DrawerTransactionItem key={step.id}>
                  <StepNumberArea>
                    <StepNumberBadge>{index + 1}</StepNumberBadge>
                  </StepNumberArea>
                  <StepContentArea>
                    <DrawerStepIndicator $status={step.status}>
                      {step.status === "signed" ? (
                        <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />
                      ) : isCurrentStep ? (
                        <SpinningLoader>
                          <Loader2Icon size={18} color={canonHeaderTokens.brand.green} />
                        </SpinningLoader>
                      ) : (
                        <CircleDashedIcon size={18} color={canonHeaderTokens.foreground.accent30} />
                      )}
                    </DrawerStepIndicator>
                    <DrawerTransactionLabelRow>
                      <DrawerTransactionLabelBold>{prefix}</DrawerTransactionLabelBold>
                      <DrawerTransactionLabelNormal>{suffix}</DrawerTransactionLabelNormal>
                    </DrawerTransactionLabelRow>
                  </StepContentArea>
                </DrawerTransactionItem>
              );
            })}
          </DrawerTransactionList>
        </DrawerContent>
      </DrawerPanel>

      {/* Main Content */}
      <Container>
        <ContentWrapper>
          {/* Breadcrumb */}
          <Breadcrumb
            onNavigateToCreate={onNavigateToCreate}
            currentPage={breadcrumbPage}
            standalone={breadcrumbStandalone}
          />

          {/* Action Preview Card */}
          <ActionPreviewCard>
            <PreviewHeader>
              <ActionTitle>{displayTitle}</ActionTitle>
              <FactoryInfo>
                <FactoryLabel>CANON FACTORY</FactoryLabel>
                <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                <FactoryValue>{factoryType}</FactoryValue>
              </FactoryInfo>
            </PreviewHeader>

            {/* Parameters Toggle - only shown when hideParameters is false */}
            {!hideParameters &&
              (formData ? (
                <>
                  <ParametersToggle onClick={() => setParametersExpanded(!parametersExpanded)}>
                    <ToggleContent>
                      {parametersExpanded ? (
                        <MinusIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                      ) : (
                        <PlusIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                      )}
                      <ToggleLabel>PARAMETERS</ToggleLabel>
                    </ToggleContent>
                  </ParametersToggle>

                  {parametersExpanded && <ParametersDisplay formData={formData} />}
                </>
              ) : (
                <ParametersToggle>
                  <ToggleContent>
                    <PlusIcon size={12} color={canonHeaderTokens.foreground.accent30} />
                    <ToggleLabel>PARAMETERS</ToggleLabel>
                  </ToggleContent>
                </ParametersToggle>
              ))}
          </ActionPreviewCard>

          {/* Status Bar */}
          <StatusSection>
            <StatusBarMain>
              <StatusLeft>
                <StatusLabel>STATUS</StatusLabel>
                <StatusCounter>
                  {signedCount}/{totalCount}
                </StatusCounter>
                <StatusIndicator>
                  <StatusDot />
                  <ProgressBarSmall>
                    <ProgressFill $progress={progress} />
                  </ProgressBarSmall>
                </StatusIndicator>
              </StatusLeft>
              <StatusRight>
                <ExpandButton onClick={() => setDrawerOpen(true)}>
                  <ListIcon size={20} color={canonHeaderTokens.foreground.accent20} />
                </ExpandButton>
              </StatusRight>
            </StatusBarMain>
            <StatusShadow1 />
            <StatusShadow2 />
          </StatusSection>

          {/* Nonce Selection (if enabled) */}
          {nonceSelectionEnabled && currentStep?.id?.startsWith("sign") && (
            <NonceSelector
              currentNonce={currentSafeNonce}
              recommendedNonce={recommendedNonce}
              selectedNonce={selectedNonce}
              onNonceChange={setSelectedNonce}
              isReadOnly={isNonceLocked}
              queueItems={queueItems}
            />
          )}

          {/* Sign Transaction Section */}
          <SignTransactionSection>
            <SectionLabel>SIGN TRANSACTION</SectionLabel>
            <SignTransactionCardWrapper>
              {/* Header Card */}
              <SignItemHeader>
                <SignItemIcon $isWaiting={currentStep?.status === "waiting"}>
                  {currentStep?.status === "waiting" ? (
                    <SpinningLoader>
                      <Loader2Icon size={20} color={canonHeaderTokens.brand.green} />
                    </SpinningLoader>
                  ) : (
                    <CircleDashedIcon size={20} color={canonHeaderTokens.foreground.accent30} />
                  )}
                </SignItemIcon>
                <SignItemTitleRow>
                  <SignItemTitleBold>Transaction:</SignItemTitleBold>
                  <SignItemTitleNormal>{currentStep?.title}</SignItemTitleNormal>
                </SignItemTitleRow>
              </SignItemHeader>

              {/* Details Card Container */}
              <SignItemDetailsWrapper>
                <SignItemDetailsCard>
                  {/* Details Content */}
                  <SignItemDetails>
                    <DetailRow>
                      <DetailLabel>Address</DetailLabel>
                      {currentStep?.to ? (
                        <CopyableText
                          text={currentStep.to}
                          iconSize={10}
                          iconColor={canonHeaderTokens.foreground.accent30}
                        >
                          <DetailValue>{currentStep.to}</DetailValue>
                        </CopyableText>
                      ) : (
                        <DetailValue></DetailValue>
                      )}
                    </DetailRow>
                    <DetailDivider />
                    <DetailRow>
                      <DetailLabel>Hash</DetailLabel>
                      {currentStep?.data ? (
                        <CopyableText
                          text={currentStep.data}
                          iconSize={10}
                          iconColor={canonHeaderTokens.foreground.accent30}
                        >
                          <HashValue>{currentStep.data}</HashValue>
                        </CopyableText>
                      ) : (
                        <HashValue></HashValue>
                      )}
                    </DetailRow>
                  </SignItemDetails>

                  {/* Sign Button */}
                  <SignButtonWrapper>
                    {currentStep?.status === "waiting" ? (
                      <WaitingButton disabled>Confirm in Wallet...</WaitingButton>
                    ) : isSwitchingChain ? (
                      <WaitingButton disabled>Switching Network...</WaitingButton>
                    ) : !isConnected ? (
                      <SignButton onClick={handleSignClick}>CONNECT WALLET</SignButton>
                    ) : isSigning ? (
                      <WaitingButton disabled>
                        <CircularProgress size={16} sx={{ color: "inherit", mr: 1 }} />
                        Waiting for wallet...
                      </WaitingButton>
                    ) : !isSigner ? (
                      <StyledTooltip title='Connected wallet is not a signer' placement='top'>
                        <span style={{ width: "100%" }}>
                          <DisabledSignButton data-testid='sign-button-disabled'>SIGN</DisabledSignButton>
                        </span>
                      </StyledTooltip>
                    ) : (
                      <SignButton onClick={handleSignClick} data-testid='sign-button'>
                        SIGN
                      </SignButton>
                    )}
                  </SignButtonWrapper>
                </SignItemDetailsCard>
              </SignItemDetailsWrapper>
            </SignTransactionCardWrapper>
          </SignTransactionSection>
        </ContentWrapper>
      </Container>
    </>
  );
};

// Styled Components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 120px 64px",
  width: "100%",
  boxSizing: "border-box",
});

const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
  maxWidth: "576px",
});

// Drawer Styles
const DrawerOverlay = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})<{ $isOpen: boolean }>(({ $isOpen }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  opacity: $isOpen ? 1 : 0,
  visibility: $isOpen ? "visible" : "hidden",
  transition: "opacity 0.3s ease, visibility 0.3s ease",
  zIndex: 1000,
}));

const DrawerPanel = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})<{ $isOpen: boolean }>(({ $isOpen }) => ({
  position: "fixed",
  top: "12px",
  right: "12px",
  bottom: "12px",
  width: "440px",
  backgroundColor: canonHeaderTokens.background.layer1,
  transform: $isOpen ? "translateX(0)" : "translateX(calc(100% + 24px))",
  transition: "transform 0.3s ease",
  zIndex: 1001,
  display: "flex",
  flexDirection: "column",
  gap: "32px",
  boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.3)",
  borderRadius: "16px",
  padding: "24px",
}));

const DrawerHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 8px",
});

const DrawerTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
});

const CloseButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  background: "none",
  border: "none",
  borderRadius: "100px",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.foreground.accent40 + "40",
  },
});

const DrawerContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "auto",
});

const DrawerActionInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px 8px",
});

const DrawerActionTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
});

const DrawerFactoryInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const DrawerTransactionList = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

const DrawerTransactionItem = styled(Box)({
  display: "flex",
  alignItems: "stretch",
  borderTop: `1px solid ${canonHeaderTokens.foreground.accent50}`,
});

const StepNumberArea = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 8px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const StepNumberBadge = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "28px",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  fontSize: "11px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent10,
  flexShrink: 0,
});

const StepContentArea = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flex: 1,
  padding: "16px 9px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const DrawerStepIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$status",
})<{ $status: string }>(({ $status }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: $status === "signed" ? canonHeaderTokens.brand.green : "transparent",
  flexShrink: 0,
}));

const DrawerTransactionLabelRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const DrawerTransactionLabelBold = styled(Typography)({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const DrawerTransactionLabelNormal = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

// Action Preview Card Styles
const ActionPreviewCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

const PreviewHeader = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "16px",
});

const ActionTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
});

const FactoryInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const FactoryLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const FactoryValue = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

const ParametersToggle = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "36px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
  cursor: "pointer",
  "&:hover": {
    opacity: 0.9,
  },
});

const ToggleContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
});

const ToggleLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

// Status Bar Styles
const StatusSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
});

const StatusBarMain = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  zIndex: 1,
});

const StatusLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const StatusLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const StatusCounter = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  fontFamily: "monospace",
});

const StatusIndicator = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "0",
});

const StatusDot = styled(Box)({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: canonHeaderTokens.foreground.accent20,
  marginRight: "-3px",
  zIndex: 1,
});

const ProgressBarSmall = styled(Box)({
  width: "100px",
  height: "6px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
  borderRadius: "100px",
  overflow: "hidden",
});

const ProgressFill = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$progress",
})<{ $progress: number }>(({ $progress }) => ({
  width: `${$progress}%`,
  height: "100%",
  backgroundColor: canonHeaderTokens.foreground.accent20,
  borderRadius: "100px",
  transition: "width 0.3s ease",
}));

const StatusBar = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "576px",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  zIndex: 1,
});

const StatusCount = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  fontFamily: "'JetBrains Mono', monospace",
});

const ProgressBarContainer = styled(Box)({
  width: "100px",
  height: "6px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
  borderRadius: "100px",
  overflow: "hidden",
});

const ProgressBarFill = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isComplete",
})<{ $isComplete?: boolean }>(({ $isComplete }) => ({
  width: "100%",
  height: "100%",
  backgroundColor: $isComplete ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent20,
  borderRadius: "100px",
}));

const StatusShadow1 = styled(Box)({
  width: "544px",
  height: "6px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "0 0 8px 8px",
  opacity: 0.5,
});

const StatusShadow2 = styled(Box)({
  width: "512px",
  height: "6px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "0 0 8px 8px",
  opacity: 0.2,
});

const StatusRight = styled(Box)({
  display: "flex",
  alignItems: "center",
});

const ExpandButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  padding: "4px",
  cursor: "pointer",
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: canonHeaderTokens.foreground.accent40 + "40",
  },
});

// Sign Transaction Section Styles
const SignTransactionSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const SectionLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
  padding: "8px",
});

const SignTransactionCardWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  position: "relative",
  isolation: "isolate",
  width: "576px",
});

const SignItemHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "20px 24px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)",
  position: "relative",
  zIndex: 2,
});

const SignItemIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isWaiting",
})<{ $isWaiting: boolean }>({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const SignItemTitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const SignItemTitleBold = styled(Typography)({
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
});

const SignItemTitleNormal = styled(Typography)({
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
});

const SignItemDetailsWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "0 6px",
  position: "relative",
  zIndex: 1,
  width: "100%",
});

const SignItemDetailsCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "0 0 16px 16px",
  overflow: "hidden",
  width: "100%",
});

const SignItemDetails = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  width: "100%",
  boxSizing: "border-box",
});

const DetailRow = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  gap: "4px",
  width: "100%",
  minWidth: 0,
});

const DetailLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  width: "84px",
  flexShrink: 0,
  whiteSpace: "pre-wrap",
});

const DetailValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const HashValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  wordBreak: "break-all",
  maxWidth: "100%",
  overflow: "hidden",
});

const DetailDivider = styled(Box)({
  width: "100%",
  height: "0.5px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

const SignButtonWrapper = styled(Box)({
  padding: "20px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const SignButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.9,
  },
});

const DisabledSignButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: "none",
  cursor: "not-allowed",
  opacity: 0.5,
});

const WaitingButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: "transparent",
  color: canonHeaderTokens.foreground.accent20,
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: "default",
  "&:disabled": {
    opacity: 0.8,
  },
});

// Success State Styles
const SuccessCardWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  width: "576px",
  borderRadius: "8px",
  overflow: "hidden",
});

const SuccessContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "20px",
  padding: "48px 24px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const SuccessIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
  borderRadius: "1000px",
  backgroundColor: canonHeaderTokens.brand.green,
});

const SuccessTextContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
});

const SuccessTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
});

const SuccessSubtext = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  textAlign: "center",
  width: "160px",
});

const SuccessButtonSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "20px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const SuccessButtonRow = styled(Box)({
  display: "flex",
  gap: "12px",
  width: "100%",
});

const OutlineButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  height: "44px",
  padding: "8px 20px",
  borderRadius: "100px",
  backgroundColor: "transparent",
  color: canonHeaderTokens.foreground.accent10,
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
    backgroundColor: canonHeaderTokens.foreground.accent40 + "20",
  },
});

const GreenButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  height: "44px",
  padding: "8px 20px",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.9,
  },
});

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningLoader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  animation: `${spin} 1s linear infinite`,
});
