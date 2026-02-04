import { useState, useEffect } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { BoxIcon, ZapIcon, ZapOffIcon, CheckIcon, LockIcon, InfoIcon, VectorSquareIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { QueueItem as QueueItemType } from "~/services";
import { getFactoryDisplayName as getFactoryDisplay } from "~/utils/factoryDisplay";
import type { Address } from "viem";

interface QueueItemProps {
  item: QueueItemType;
  connectedAddress?: Address;
  safeOwners?: Address[];
  emergencyMode?: boolean;
  emergencyCaller?: Address | null;
  onSign?: () => void;
  onExecute?: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
  isSignLoading?: boolean;
  isRemoveLoading?: boolean;
}

export const QueueItem = ({
  item,
  connectedAddress,
  safeOwners = [],
  emergencyMode = false,
  emergencyCaller,
  onSign,
  onExecute,
  onRemove,
  isLoading,
  isSignLoading,
  isRemoveLoading,
}: QueueItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const {
    actionBuilderAddress,
    nonce,
    currentNonce,
    label,
    factoryType,
    factoryLabel,
    isHubChild,
    hubType,
    hubLabel,
    proposer,
    approversCount,
    threshold,
    isPreApproved,
    hasExecutionDelay,
    executionDelayRemaining,
    isFullySigned,
    isAtCurrentNonce,
  } = item;

  // Stale nonce: item's nonce is behind current nonce (signatures are invalid)
  const isStaleNonce = nonce < currentNonce;

  // Warning state: 0 signatures OR stale nonce (needs re-signing)
  const isWarningState = approversCount === 0 || isStaleNonce;

  // Untitled state: no label in registry
  const isUntitled = !label || label.trim() === "";
  const displayLabel = isUntitled ? "Untitled Transaction" : label;

  // Real-time countdown for execution delay
  const [remainingSeconds, setRemainingSeconds] = useState(executionDelayRemaining);

  // Sync with prop when it changes
  useEffect(() => {
    setRemainingSeconds(executionDelayRemaining);
  }, [executionDelayRemaining]);

  // Countdown timer - decrements every second while there's time remaining
  useEffect(() => {
    if (!hasExecutionDelay || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasExecutionDelay, remainingSeconds]);

  // Get display label for factory type using centralized utility
  const getFactoryDisplayName = (): string => {
    const displayName = getFactoryDisplay(factoryType);
    // Fall back to factoryLabel if unknown (CSS handles uppercase)
    return displayName !== "Unknown" ? displayName : factoryLabel || "Unknown";
  };

  // Humanize execution delay - never show seconds
  const humanizeDelay = (seconds: number): string => {
    if (seconds <= 0) return "";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return days === 1 ? "1 day left" : `${days} days left`;
    }
    if (hours > 0) {
      return hours === 1 ? "1 hour left" : `${hours} hours left`;
    }
    if (minutes > 0) {
      return minutes === 1 ? "1 minute left" : `${minutes} minutes left`;
    }
    return "<1 minute left";
  };

  // Check if connected wallet is a Safe signer
  const isSigner =
    connectedAddress && safeOwners.some((owner) => owner.toLowerCase() === connectedAddress.toLowerCase());

  // Check if connected wallet is the emergency caller
  const isEmergencyCaller =
    connectedAddress && emergencyCaller && connectedAddress.toLowerCase() === emergencyCaller.toLowerCase();

  // Get the reason why Execute is disabled (prioritized order)
  const getExecuteDisableReason = (): string | null => {
    if (!isSigner && !isEmergencyCaller) return "Connected wallet is not a signer";
    if (emergencyMode && !isEmergencyCaller) return "Only emergency caller while in emergency mode";
    if (!isFullySigned) return "Waiting for signatures";
    if (!isAtCurrentNonce) return "Waiting to be upcoming nonce";
    if (remainingSeconds > 0) return "Cooldown in progress";
    return null; // Executable
  };

  // Determine action button state
  // Sign: signers can sign if not fully signed, including stale items that need re-signing
  const showSignButton = isSigner && !isFullySigned;
  // Execute: show when wallet is connected AND sign button is not showing
  const showExecuteButton = !!connectedAddress && !showSignButton;
  const executeDisableReason = showExecuteButton ? getExecuteDisableReason() : null;
  const showNoAction = !isAtCurrentNonce && !showSignButton && !showExecuteButton;

  // Show remove button only if connected wallet is the proposer
  const isProposer = connectedAddress && proposer && connectedAddress.toLowerCase() === proposer.toLowerCase();
  const showRemoveButton = isProposer;

  return (
    <ItemContainer onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Left Panel - Nonce/Warning + Signed indicator */}
      <LeftPanel>
        <NonceSection>
          {isWarningState ? (
            <WarningContainer>
              <InfoIcon size={12} color={canonHeaderTokens.status.amber} />
              <WarningText>Warning</WarningText>
            </WarningContainer>
          ) : (
            <NonceText>{nonce}</NonceText>
          )}
        </NonceSection>
        <SignedSection>
          <SignedIndicator $state={getSignedState(approversCount, threshold)} />
          <SignedLabel $state={getSignedState(approversCount, threshold)}>Signed</SignedLabel>
          <SignedCount $state={getSignedState(approversCount, threshold)}>
            {approversCount}/{threshold}
          </SignedCount>
        </SignedSection>
      </LeftPanel>

      {/* Right Panel - Details */}
      <RightPanel>
        <TopRow>
          <TitleSection>
            <Title $isUntitled={isUntitled}>{displayLabel}</Title>
            <AddressRow $isVisible={isHovered}>
              <CopyableText text={actionBuilderAddress} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
                <AddressText>{actionBuilderAddress}</AddressText>
              </CopyableText>
            </AddressRow>
          </TitleSection>
          <ActionSection>
            {showRemoveButton && (isHovered || isRemoveLoading) && (
              <RemoveButton onClick={onRemove} disabled={isRemoveLoading}>
                {isRemoveLoading ? (
                  <CircularProgress size={14} sx={{ color: canonHeaderTokens.foreground.accent10 }} />
                ) : (
                  "REMOVE"
                )}
              </RemoveButton>
            )}
            {showExecuteButton && (
              <StyledTooltip
                title={executeDisableReason || ""}
                placement='top'
                disableHoverListener={!executeDisableReason}
              >
                <span>
                  <ExecuteButton
                    onClick={onExecute}
                    disabled={!!executeDisableReason || isLoading}
                    data-testid='execute-button'
                  >
                    {isLoading ? (
                      <CircularProgress size={14} sx={{ color: canonHeaderTokens.background.layer0 }} />
                    ) : (
                      "EXECUTE"
                    )}
                  </ExecuteButton>
                </span>
              </StyledTooltip>
            )}
            {showSignButton && (
              <SignButton onClick={onSign} disabled={isSignLoading} data-testid='sign-button'>
                {isSignLoading ? (
                  <CircularProgress size={14} sx={{ color: canonHeaderTokens.foreground.accent10 }} />
                ) : (
                  "SIGN"
                )}
              </SignButton>
            )}
            {showNoAction && !showRemoveButton && <EmptyAction />}
          </ActionSection>
        </TopRow>

        <BottomRow>
          <FactoryInfoSection>
            <FactoryInfo>
              <BoxIcon size={14} color={canonHeaderTokens.foreground.accent20} />
              <FactoryLabel>{isHubChild ? hubType || "Capped Transfer" : getFactoryDisplayName()}</FactoryLabel>
            </FactoryInfo>
            {isHubChild && (
              <HubInfo>
                <VectorSquareIcon size={14} color={canonHeaderTokens.foreground.accent20} />
                <HubLabel>{hubLabel || "Untitled Hub"}</HubLabel>
              </HubInfo>
            )}
          </FactoryInfoSection>

          <StatusInfo>
            {/* Execution Delay */}
            <DelayInfo>
              {remainingSeconds > 0 ? (
                <>
                  <DelayDot />
                  <DelayText>{humanizeDelay(remainingSeconds)}</DelayText>
                  <LockIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                </>
              ) : (
                <>
                  <CheckIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                  <DelayText>Execution Delay Over</DelayText>
                </>
              )}
            </DelayInfo>

            <Divider />

            {/* Fast/Slow Path */}
            <StyledTooltip
              title={
                isPreApproved
                  ? "This transaction is pre-approved and will follow the fast-path with a shorter delay."
                  : "This transaction requires signatures and will follow the slow-path with a longer delay."
              }
              placement='top'
            >
              <PathInfo $isFastPath={isPreApproved}>
                {isPreApproved ? (
                  <>
                    <ZapIcon size={12} color={canonHeaderTokens.brand.green} />
                    <PathText $isFastPath={true}>Fast-path</PathText>
                  </>
                ) : (
                  <>
                    <ZapOffIcon size={12} color={canonHeaderTokens.status.red} />
                    <PathText $isFastPath={false}>Slow-path</PathText>
                  </>
                )}
              </PathInfo>
            </StyledTooltip>
          </StatusInfo>
        </BottomRow>
      </RightPanel>
    </ItemContainer>
  );
};

// Helper to determine signed indicator state
type SignedState = "full" | "partial" | "warning";

const getSignedState = (count: number, threshold: number): SignedState => {
  if (count >= threshold) return "full";
  if (count > 0) return "partial";
  return "warning";
};

// Styled Components
const ItemContainer = styled(Box)({
  display: "flex",
  width: "100%",
  borderRadius: "8px",
  overflow: "hidden",
});

const LeftPanel = styled(Box)({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "160px",
  minWidth: "160px",
  padding: "16px",
  backgroundColor: "#202026", // layer1-variation
});

const NonceSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
});

const NonceText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  textAlign: "right",
});

const WarningContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const WarningText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.status.amber,
});

const SignedSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

const SignedIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$state",
})<{ $state: SignedState }>(({ $state }) => ({
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  backgroundColor: $state === "full" ? canonHeaderTokens.brand.green : "transparent",
  border:
    $state === "full"
      ? "none"
      : $state === "warning"
        ? `2px solid ${canonHeaderTokens.status.amberLight}`
        : `2px solid ${canonHeaderTokens.foreground.accent40}`,
  position: "relative",
  "&::after":
    $state === "full"
      ? {
          content: '"✓"',
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "8px",
          color: canonHeaderTokens.background.layer0,
        }
      : {},
}));

const SignedLabel = styled("span", {
  shouldForwardProp: (prop) => prop !== "$state",
})<{ $state: SignedState }>(({ $state }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color:
    $state === "full"
      ? canonHeaderTokens.brand.green
      : $state === "warning"
        ? canonHeaderTokens.status.amberLight
        : canonHeaderTokens.foreground.accent10,
}));

const SignedCount = styled("span", {
  shouldForwardProp: (prop) => prop !== "$state",
})<{ $state: SignedState }>(({ $state }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color:
    $state === "full"
      ? canonHeaderTokens.brand.green
      : $state === "warning"
        ? canonHeaderTokens.status.amberLight
        : canonHeaderTokens.foreground.accent10,
}));

const RightPanel = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  padding: "16px 20px",
  gap: "32px",
  backgroundColor: canonHeaderTokens.background.layer1,
  justifyContent: "center",
});

const TopRow = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  width: "100%",
});

const TitleSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  flex: 1,
});

const Title = styled("span", {
  shouldForwardProp: (prop) => prop !== "$isUntitled",
})<{ $isUntitled: boolean }>(({ $isUntitled }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: $isUntitled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent0,
  textAlign: "left",
}));

const AddressRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isVisible",
})<{ $isVisible: boolean }>(({ $isVisible }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  opacity: $isVisible ? 1 : 0,
  transition: "opacity 0.2s ease",
  pointerEvents: $isVisible ? "auto" : "none",
}));

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ActionSection = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "8px",
  height: "36px",
});

const ExecuteButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "90px",
  height: "28px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: `1px solid ${disabled ? canonHeaderTokens.foreground.accent40 : "rgba(21, 164, 62, 0.3)"}`,
  backgroundColor: "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: disabled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.brand.green,
  "&:hover": {
    opacity: disabled ? 1 : 0.8,
  },
}));

const SignButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "80px",
  height: "28px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  backgroundColor: "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
  opacity: disabled ? 0.6 : 1,
  "&:hover": {
    opacity: disabled ? 0.6 : 0.8,
  },
}));

const RemoveButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "80px",
  height: "28px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  backgroundColor: "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
  opacity: disabled ? 0.6 : 1,
  "&:hover": {
    opacity: disabled ? 0.6 : 0.8,
  },
}));

const EmptyAction = styled(Box)({
  width: "104px",
  height: "36px",
});

const BottomRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

const FactoryInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const FactoryLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

const FactoryInfoSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const HubInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const HubLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const StatusInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const DelayInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const DelayDot = styled(Box)({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: canonHeaderTokens.status.amber,
});

const DelayText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const Divider = styled(Box)({
  width: "16px",
  height: "0.5px",
  backgroundColor: canonHeaderTokens.foreground.accent30,
});

const PathInfo = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const PathText = styled("span", {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isFastPath ? canonHeaderTokens.brand.green : canonHeaderTokens.status.red,
}));
