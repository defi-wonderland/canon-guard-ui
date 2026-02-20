import { useState, useEffect } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import {
  BoxIcon,
  CheckIcon,
  CheckCheckIcon,
  LockIcon,
  ZapIcon,
  ZapOffIcon,
  CircleFadingPlusIcon,
  CircleDashedIcon,
} from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { getFactoryDisplayName } from "~/utils/factoryDisplay";
import type { ActionDetailModalData } from "./index";
import type { Address } from "viem";

interface OverviewTabProps {
  data: ActionDetailModalData;
  onSign?: () => void;
  onExecute?: () => void;
  onRemove?: () => void;
  onQueue?: () => void;
  isExecuteLoading?: boolean;
  isRemoveLoading?: boolean;
  connectedAddress?: Address;
  isSigner?: boolean;
  emergencyMode?: boolean;
  emergencyCaller?: Address | null;
}

export const OverviewTab = ({
  data,
  onSign,
  onExecute,
  onRemove,
  isExecuteLoading,
  isRemoveLoading,
  connectedAddress,
  isSigner,
  emergencyMode,
  emergencyCaller,
}: OverviewTabProps) => {
  const isQueue = data.mode === "queue";

  return (
    <Container>
      {/* Info Section */}
      <InfoSection>
        {isQueue && <QueueInfoRows data={data} />}
        {!isQueue && <CanonListInfoRows data={data} />}
      </InfoSection>

      {/* Action Buttons (queue mode only) */}
      {isQueue && (
        <ActionButtonsSection
          data={data}
          onSign={onSign}
          onExecute={onExecute}
          onRemove={onRemove}
          isExecuteLoading={isExecuteLoading}
          isRemoveLoading={isRemoveLoading}
          connectedAddress={connectedAddress}
          isSigner={isSigner}
          emergencyMode={emergencyMode}
          emergencyCaller={emergencyCaller}
        />
      )}

      {/* Activity Timeline (queue mode only) */}
      {isQueue && <ActivityTimeline data={data} />}
    </Container>
  );
};

// ============================================
// Queue-mode Info Rows
// ============================================
const QueueInfoRows = ({ data }: { data: ActionDetailModalData }) => {
  const item = data.mode === "queue" ? data.item : null;

  // Real-time countdown
  const [remainingSeconds, setRemainingSeconds] = useState(item?.executionDelayRemaining ?? 0);

  useEffect(() => {
    setRemainingSeconds(item?.executionDelayRemaining ?? 0);
  }, [item?.executionDelayRemaining]);

  useEffect(() => {
    if (!item?.hasExecutionDelay || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [item?.hasExecutionDelay, remainingSeconds]);

  if (!item) return null;

  const factoryDisplayName = getFactoryDisplayName(item.factoryType);
  const displayFactory = factoryDisplayName !== "Unknown" ? factoryDisplayName : item.factoryLabel || "Unknown";
  const isFullySigned = item.isFullySigned;

  return (
    <InfoRows>
      {/* Nonce */}
      <InfoRow>
        <InfoLabel>Nonce</InfoLabel>
        <InfoValue>{item.nonce}</InfoValue>
      </InfoRow>
      <InfoDivider />

      {/* Canon Factory */}
      <InfoRow>
        <InfoLabel>Canon Factory</InfoLabel>
        <InfoValueRow>
          <BoxIcon size={14} color={canonHeaderTokens.foreground.accent20} />
          <FactoryText>{displayFactory.toUpperCase()}</FactoryText>
        </InfoValueRow>
      </InfoRow>
      <InfoDivider />

      {/* Signature Status */}
      <InfoRow>
        <InfoLabel>Signature Status</InfoLabel>
        <InfoValueRow>
          <SignedIndicator $isFull={isFullySigned} />
          <SignedText $isFull={isFullySigned}>Signed</SignedText>
          <SignedCount $isFull={isFullySigned}>
            {item.approversCount}/{item.threshold}
          </SignedCount>
        </InfoValueRow>
      </InfoRow>
      <InfoDivider />

      {/* Pre-Approval */}
      <InfoRow>
        <InfoLabel>Pre-Approval</InfoLabel>
        <PreApprovalValue>
          <PreApprovalStatus>{item.isPreApproved ? "Active" : "Inactive"}</PreApprovalStatus>
          {item.isPreApproved && (
            <>
              <PreApprovalDash />
              <PathIndicator>
                <ZapIcon size={12} color={canonHeaderTokens.brand.green} />
                <PathText $isFastPath={true}>Fast-path</PathText>
              </PathIndicator>
            </>
          )}
          {!item.isPreApproved && (
            <>
              <PreApprovalDash />
              <PathIndicator>
                <ZapOffIcon size={12} color={canonHeaderTokens.status.red} />
                <PathText $isFastPath={false}>Slow-path</PathText>
              </PathIndicator>
            </>
          )}
        </PreApprovalValue>
      </InfoRow>
      <InfoDivider />

      {/* Execution Delay */}
      <InfoRow>
        <InfoLabel>Execution Delay</InfoLabel>
        {remainingSeconds > 0 ? (
          <DelayActiveRow>
            <LockIcon size={12} color={canonHeaderTokens.foreground.accent20} />
            <DelayDot />
            <DelayTimeText>{formatDelay(remainingSeconds)}</DelayTimeText>
          </DelayActiveRow>
        ) : (
          <DelayOverRow>
            <CheckIcon size={12} color={canonHeaderTokens.foreground.accent20} />
            <DelayOverText>Execution Delay Over</DelayOverText>
          </DelayOverRow>
        )}
      </InfoRow>
    </InfoRows>
  );
};

// ============================================
// Canon List-mode Info Rows
// ============================================
const CanonListInfoRows = ({ data }: { data: ActionDetailModalData }) => {
  if (data.mode !== "canonList") return null;
  const { entity } = data;

  const factoryDisplayName = getFactoryDisplayName(entity.factoryType);
  const displayFactory = factoryDisplayName !== "Unknown" ? factoryDisplayName : entity.factoryLabel || "Unknown";

  return (
    <InfoRows>
      {/* Canon Factory */}
      <InfoRow>
        <InfoLabel>Canon Factory</InfoLabel>
        <InfoValueRow>
          <BoxIcon size={14} color={canonHeaderTokens.foreground.accent20} />
          <FactoryText>{displayFactory.toUpperCase()}</FactoryText>
        </InfoValueRow>
      </InfoRow>
      <InfoDivider />

      {/* Pre-Approval */}
      <InfoRow>
        <InfoLabel>Pre-Approval</InfoLabel>
        <PreApprovalValue>
          <PreApprovalStatus>{entity.isFastPath ? "Active" : "Inactive"}</PreApprovalStatus>
          <PreApprovalDash />
          <PathIndicator>
            {entity.isFastPath ? (
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
          </PathIndicator>
        </PreApprovalValue>
      </InfoRow>
    </InfoRows>
  );
};

// ============================================
// Action Buttons
// ============================================
interface ActionButtonsSectionProps {
  data: ActionDetailModalData;
  onSign?: () => void;
  onExecute?: () => void;
  onRemove?: () => void;
  isExecuteLoading?: boolean;
  isRemoveLoading?: boolean;
  connectedAddress?: Address;
  isSigner?: boolean;
  emergencyMode?: boolean;
  emergencyCaller?: Address | null;
}

const ActionButtonsSection = ({
  data,
  onSign,
  onExecute,
  onRemove,
  isExecuteLoading,
  isRemoveLoading,
  connectedAddress,
  isSigner,
  emergencyMode = false,
  emergencyCaller,
}: ActionButtonsSectionProps) => {
  const item = data.mode === "queue" ? data.item : null;

  const [remainingSeconds, setRemainingSeconds] = useState(item?.executionDelayRemaining ?? 0);

  useEffect(() => {
    setRemainingSeconds(item?.executionDelayRemaining ?? 0);
  }, [item?.executionDelayRemaining]);

  useEffect(() => {
    if (!item?.hasExecutionDelay || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [item?.hasExecutionDelay, remainingSeconds]);

  if (!item) return null;

  const hasAlreadySigned =
    connectedAddress && item.approvers.some((a) => a.toLowerCase() === connectedAddress.toLowerCase());

  const isEmergencyCaller =
    connectedAddress && emergencyCaller && connectedAddress.toLowerCase() === emergencyCaller.toLowerCase();

  const getExecuteDisableReason = (): string | null => {
    if (!isSigner && !isEmergencyCaller) return "Connected wallet is not a signer";
    if (emergencyMode && !isEmergencyCaller) return "Only emergency caller while in emergency mode";
    if (!item.isFullySigned) return "Waiting for signatures";
    if (!item.isAtCurrentNonce) return "Waiting to be upcoming nonce";
    if (remainingSeconds > 0) return "Cooldown in progress";
    return null;
  };

  const showSignButton = isSigner && !item.isFullySigned;
  const showExecuteButton = !!connectedAddress && !showSignButton;
  const executeDisableReason = showExecuteButton ? getExecuteDisableReason() : null;

  const isProposer =
    connectedAddress && item.proposer && connectedAddress.toLowerCase() === item.proposer.toLowerCase();
  const showRemoveButton = !!isProposer;

  return (
    <ButtonsContainer>
      <ButtonsRow>
        {showRemoveButton && (
          <ActionButton $variant='red' onClick={onRemove} disabled={isRemoveLoading}>
            {isRemoveLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "CANCEL"}
          </ActionButton>
        )}
        {showSignButton && (
          <ActionButton $variant='green' onClick={onSign}>
            SIGN
          </ActionButton>
        )}
        {showExecuteButton && (
          <StyledTooltip
            title={executeDisableReason || ""}
            placement='top'
            disableHoverListener={!executeDisableReason}
          >
            <ExecuteTooltipWrapper>
              <ActionButton $variant='green' onClick={onExecute} disabled={!!executeDisableReason || isExecuteLoading}>
                {isExecuteLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "EXECUTE"}
              </ActionButton>
            </ExecuteTooltipWrapper>
          </StyledTooltip>
        )}
        {/* Already signed state */}
        {hasAlreadySigned && !showSignButton && !showExecuteButton && (
          <SignedStateButton>
            <CheckCheckIcon size={12} color={canonHeaderTokens.foreground.accent10} />
            <SignedStateText>Signed</SignedStateText>
          </SignedStateButton>
        )}
      </ButtonsRow>
    </ButtonsContainer>
  );
};

// ============================================
// Activity Timeline
// ============================================
const ActivityTimeline = ({ data }: { data: ActionDetailModalData }) => {
  if (data.mode !== "queue") return null;
  const { item } = data;

  return (
    <TimelineContainer>
      {/* Added to Queue entry */}
      <TimelineEntry $isLast={item.approversCount === 0 && item.threshold - item.approversCount <= 1}>
        <TimelineIconWrapper>
          <CircleFadingPlusIcon size={16} color={canonHeaderTokens.foreground.accent20} />
        </TimelineIconWrapper>
        <TimelineContent>
          <TimelineHeader>
            <TimelineTitle>Added to Queue</TimelineTitle>
          </TimelineHeader>
          <TimelineAddress>
            <CopyableText
              text={item.actionBuilderAddress}
              iconSize={10}
              iconColor={canonHeaderTokens.foreground.accent30}
            >
              <TimelineAddressText>{item.actionBuilderAddress}</TimelineAddressText>
            </CopyableText>
          </TimelineAddress>
        </TimelineContent>
        {item.approversCount > 0 && <TimelineLine />}
      </TimelineEntry>

      {/* Signed entries */}
      {item.approvers.map((approver, index) => (
        <TimelineEntry
          key={approver}
          $isLast={index === item.approvers.length - 1 && item.approversCount >= item.threshold}
        >
          <TimelineIconWrapper>
            <CheckCheckIcon size={16} color={canonHeaderTokens.brand.green} />
          </TimelineIconWrapper>
          <TimelineContent>
            <TimelineHeader>
              <TimelineTitle>Signed</TimelineTitle>
              <TimelineBold>
                {index + 1}/{item.threshold}
              </TimelineBold>
            </TimelineHeader>
            <TimelineAddress>
              <CopyableText text={approver} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
                <TimelineAddressText>{approver}</TimelineAddressText>
              </CopyableText>
            </TimelineAddress>
          </TimelineContent>
          {index < item.approvers.length - 1 || item.approversCount < item.threshold ? <TimelineLine /> : null}
        </TimelineEntry>
      ))}

      {/* Pending signer(s) */}
      {item.approversCount < item.threshold && (
        <TimelineEntry $isLast={true}>
          <TimelineIconWrapper>
            <CircleDashedIcon size={16} color={canonHeaderTokens.foreground.accent20} />
          </TimelineIconWrapper>
          <TimelinePendingContent>
            <TimelinePendingText>Pending Signer</TimelinePendingText>
            <TimelinePendingCount>
              {item.approversCount + 1}/{item.threshold}
            </TimelinePendingCount>
          </TimelinePendingContent>
        </TimelineEntry>
      )}
    </TimelineContainer>
  );
};

// ============================================
// Helpers
// ============================================
const formatDelay = (seconds: number): string => {
  if (seconds <= 0) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")} Hrs Left`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")} Min Left`;
};

// ============================================
// Styled Components
// ============================================
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
});

const InfoSection = styled(Box)({
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "32px",
});

const InfoRows = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const InfoRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const InfoLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  width: "137px",
  flexShrink: 0,
});

const InfoValue = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const InfoValueRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const FactoryText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  textTransform: "uppercase",
});

const InfoDivider = styled(Box)({
  height: "1px",
  width: "100%",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

// Signature Status
const SignedIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isFull",
})<{ $isFull: boolean }>(({ $isFull }) => ({
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  backgroundColor: $isFull ? canonHeaderTokens.brand.green : "transparent",
  border: $isFull ? "none" : `2px solid ${canonHeaderTokens.foreground.accent40}`,
  position: "relative",
  flexShrink: 0,
  "&::after": $isFull
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

const SignedText = styled("span", {
  shouldForwardProp: (prop) => prop !== "$isFull",
})<{ $isFull: boolean }>(({ $isFull }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isFull ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent0,
}));

const SignedCount = styled("span", {
  shouldForwardProp: (prop) => prop !== "$isFull",
})<{ $isFull: boolean }>(({ $isFull }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isFull ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent0,
}));

// Pre-Approval
const PreApprovalValue = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const PreApprovalStatus = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const PreApprovalDash = styled(Box)({
  width: "16px",
  height: "0.5px",
  backgroundColor: canonHeaderTokens.foreground.accent30,
});

const PathIndicator = styled(Box)({
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

// Execution Delay
const DelayActiveRow = styled(Box)({
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

const DelayTimeText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const DelayOverRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const DelayOverText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

// Action Buttons
const ButtonsContainer = styled(Box)({
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "24px",
});

const ButtonsRow = styled(Box)({
  display: "flex",
  gap: "12px",
  width: "100%",
});

const ExecuteTooltipWrapper = styled("span")({
  display: "flex",
  flex: 1,
});

const ActionButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "$variant",
})<{ $variant: "green" | "red"; disabled?: boolean }>(({ $variant, disabled }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  backgroundColor: $variant === "green" ? canonHeaderTokens.brand.green : canonHeaderTokens.status.red,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#ffffff",
  "&:hover": {
    opacity: disabled ? 0.6 : 0.9,
  },
}));

const SignedStateButton = styled(Box)({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
});

const SignedStateText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

// Activity Timeline
const TimelineContainer = styled(Box)({
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  padding: "20px 0",
  flex: 1,
});

const TimelineEntry = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isLast",
})<{ $isLast: boolean }>({
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  padding: "12px 32px",
  position: "relative",
});

const TimelineIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "16px",
  height: "16px",
  marginTop: "2px",
});

const TimelineContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  flex: 1,
  minWidth: 0,
});

const TimelineHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const TimelineTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const TimelineBold = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const TimelineAddress = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const TimelineAddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const TimelineLine = styled(Box)({
  position: "absolute",
  left: "39px",
  top: "40px",
  width: "1px",
  height: "32px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

const TimelinePendingContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const TimelinePendingText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

const TimelinePendingCount = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});
