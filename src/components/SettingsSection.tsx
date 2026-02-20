import { useState } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DeploymentModesPanel } from "~/components/DeploymentModesPanel";
import { EmergencyModePanel } from "~/components/EmergencyModePanel";
import {
  ChainIcon,
  HelpCircleIcon,
  ShieldCheckIcon,
  AsteriskIcon,
  ShieldAlertIcon,
  Link2Icon,
} from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { getChainConfig, SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import {
  useStateContext,
  useCanonGuardConfig,
  humanizeDuration,
  useNavigateWithParams,
  useWallet,
  useIsSigner,
} from "~/hooks";
import { truncateAddress } from "~/utils";

export const SettingsSection = () => {
  const { safeAddress, guardAddress, chainId, isDetached } = useStateContext();
  const { shortTxExecutionDelay, longTxExecutionDelay, txExpiryDelay, maxApprovalDuration, emergencyMode, isLoading } =
    useCanonGuardConfig();
  const navigate = useNavigate();
  const navigateWithParams = useNavigateWithParams();
  const { isConnected } = useWallet();
  const isSigner = useIsSigner();

  const [emergencyPanelOpen, setEmergencyPanelOpen] = useState(false);
  const [deploymentModesPanelOpen, setDeploymentModesPanelOpen] = useState(false);

  const chainConfig = getChainConfig(chainId as SupportedChainId);
  const truncatedSafeAddress = safeAddress ? truncateAddress(safeAddress) : "";

  const isAttachDetachDisabled = !isSigner;

  const handleDetachGuard = () => {
    navigateWithParams("/settings/detach");
  };

  const handleAttachGuard = () => {
    navigateWithParams("/settings/attach");
  };

  const handleManageSafes = () => {
    navigate("/settings/safes");
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress size={32} sx={{ color: canonHeaderTokens.foreground.accent20 }} />
      </LoadingContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        {/* Page Title */}
        <TitleRow>
          <PageTitle>General Settings</PageTitle>
          <StyledTooltip
            title='Configure your Canon Guard settings including encryption, emergency mode, and deployment mode.'
            placement='right'
          >
            <HelpIconWrapper>
              <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
            </HelpIconWrapper>
          </StyledTooltip>
        </TitleRow>

        {/* Section Label */}
        <SectionLabel>CANON GUARD SETUP</SectionLabel>

        {/* Safe Profile Card with Config Stats */}
        <SafeProfileCard>
          {/* Top Section - Safe Profile */}
          <SafeProfileRow>
            <SafeProfileLeft>
              <SafeIconWrapper>
                <ShieldCheckIcon size={16} color={canonHeaderTokens.foreground.accent0} />
              </SafeIconWrapper>
              <SafeInfo>
                <SafeAddressRow>
                  <SafeLabel>Safe</SafeLabel>
                  <CopyableText
                    text={safeAddress || ""}
                    iconSize={10}
                    iconColor={canonHeaderTokens.foreground.accent30}
                  >
                    <AddressText>{truncatedSafeAddress}</AddressText>
                  </CopyableText>
                </SafeAddressRow>
                <ChainRow>
                  <ChainIcon chainId={chainId as SupportedChainId} size={14} />
                  <ChainName>{chainConfig?.chain.name || "Unknown Chain"}</ChainName>
                </ChainRow>
              </SafeInfo>
            </SafeProfileLeft>
            <OutlineButton onClick={handleManageSafes} data-testid='manage-safes-button'>
              MANAGE SAFE ACCOUNTS
            </OutlineButton>
          </SafeProfileRow>

          {/* Config Stats Row */}
          <ConfigStatsRow>
            <ConfigStatsContent>
              {/* Fast Path Delay */}
              <ConfigStat>
                <ConfigStatValue>
                  <ConfigStatText>{humanizeDuration(shortTxExecutionDelay)}</ConfigStatText>
                  <StatusDot $color={canonHeaderTokens.brand.green} />
                </ConfigStatValue>
                <ConfigStatLabel>Fast Path Delay</ConfigStatLabel>
              </ConfigStat>

              <ConfigDivider />

              {/* Slow Path Delay */}
              <ConfigStat>
                <ConfigStatValue>
                  <ConfigStatText>{humanizeDuration(longTxExecutionDelay)}</ConfigStatText>
                  <StatusDot $color={canonHeaderTokens.status.amber} />
                </ConfigStatValue>
                <ConfigStatLabel>Slow Path Delay</ConfigStatLabel>
              </ConfigStat>

              <ConfigDivider />

              {/* Execution Timeframe */}
              <ConfigStat>
                <ConfigStatValue>
                  <ConfigStatText>{humanizeDuration(txExpiryDelay)}</ConfigStatText>
                </ConfigStatValue>
                <ConfigStatLabel>Execution Timeframe</ConfigStatLabel>
              </ConfigStat>

              <ConfigDivider />

              {/* Max Pre-Approval */}
              <ConfigStat>
                <ConfigStatValue>
                  <ConfigStatText>{humanizeDuration(maxApprovalDuration)}</ConfigStatText>
                </ConfigStatValue>
                <ConfigStatLabel>Max Pre-Approval</ConfigStatLabel>
              </ConfigStat>
            </ConfigStatsContent>
          </ConfigStatsRow>
        </SafeProfileCard>

        {/* Password Encryption Card */}
        <SettingCard>
          <SettingCardLeft>
            <IconCircle>
              <AsteriskIcon size={20} color={canonHeaderTokens.foreground.accent20} />
            </IconCircle>
            <SettingInfo>
              <SettingTitleRow>
                <SettingTitle>Password Encryption:</SettingTitle>
                <StatusIndicator>
                  <StatusDot $color={canonHeaderTokens.brand.green} />
                  <StatusLabel>ON</StatusLabel>
                </StatusIndicator>
              </SettingTitleRow>
              <SettingDescription>
                Transaction names are public onchain. Set a password to keep them private.
              </SettingDescription>
            </SettingInfo>
          </SettingCardLeft>
          <StyledTooltip title='Not available yet' placement='top'>
            <span>
              <OutlineButton $width='108px' $disabled={true}>
                EDIT
              </OutlineButton>
            </span>
          </StyledTooltip>
        </SettingCard>

        {/* Emergency Mode Card */}
        <SettingCard>
          <SettingCardLeft>
            <EmergencyIconCircle $isActive={emergencyMode === true}>
              <ShieldAlertIcon size={20} color={emergencyMode ? "#FFFFFF" : canonHeaderTokens.foreground.accent20} />
            </EmergencyIconCircle>
            <SettingInfo>
              <SettingTitleRow>
                <SettingTitle>Emergency Mode:</SettingTitle>
                <StatusIndicator data-testid='emergency-mode-status'>
                  <StatusDot
                    $color={emergencyMode ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent30}
                  />
                  <StatusLabel data-testid='emergency-mode-status-label'>{emergencyMode ? "ON" : "OFF"}</StatusLabel>
                </StatusIndicator>
              </SettingTitleRow>
              <SettingDescription>Use this when keys are compromised or signers are under pressure.</SettingDescription>
            </SettingInfo>
          </SettingCardLeft>
          <OutlineButton
            $width='108px'
            onClick={() => setEmergencyPanelOpen(true)}
            data-testid='settings-emergency-edit-button'
          >
            EDIT
          </OutlineButton>
        </SettingCard>

        {/* Emergency Mode Panel */}
        <EmergencyModePanel
          isOpen={emergencyPanelOpen}
          onClose={() => setEmergencyPanelOpen(false)}
          testIdPrefix='settings'
        />

        {/* Canon Guard Status Card */}
        <CanonGuardCard>
          <CanonGuardTop>
            <SettingCardLeft>
              <IconCircle>
                <Link2Icon size={20} color={canonHeaderTokens.foreground.accent20} />
              </IconCircle>
              <SettingInfo>
                <SettingTitleRow>
                  <SettingTitle>Canon Guard:</SettingTitle>
                  <StatusIndicator data-testid='canon-guard-status'>
                    <StatusDot $color={isDetached ? canonHeaderTokens.status.amber : canonHeaderTokens.brand.green} />
                    <StatusLabel data-testid='canon-guard-status-label'>
                      {isDetached ? "Detached" : "Attached"}
                    </StatusLabel>
                  </StatusIndicator>
                </SettingTitleRow>
                <SettingDescription>
                  {isDetached
                    ? "Transactions are routed through the guard but it's not attached to your Safe. "
                    : "You can adopt Canon Guard in two modes: Attached and Detached. "}
                  <LearnMoreLink onClick={() => setDeploymentModesPanelOpen(true)}>Learn more</LearnMoreLink>
                </SettingDescription>
              </SettingInfo>
            </SettingCardLeft>
            {/* Attach/Detach button: hidden when disconnected, disabled with tooltip when not signer */}
            {isConnected && (
              <StyledTooltip
                title='Connected wallet is not a signer'
                placement='top'
                disableHoverListener={!isAttachDetachDisabled}
              >
                <span>
                  <OutlineButton
                    $width='108px'
                    $disabled={isAttachDetachDisabled}
                    onClick={!isAttachDetachDisabled ? (isDetached ? handleAttachGuard : handleDetachGuard) : undefined}
                    data-testid={isDetached ? "settings-attach-button" : "settings-detach-button"}
                  >
                    {isDetached ? "ATTACH" : "DETACH"}
                  </OutlineButton>
                </span>
              </StyledTooltip>
            )}
          </CanonGuardTop>
          <CardDivider />
          <CopyableText text={guardAddress || ""} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
            <GuardAddressText>{guardAddress || ""}</GuardAddressText>
          </CopyableText>
        </CanonGuardCard>

        {/* Deployment Modes Panel */}
        <DeploymentModesPanel
          isOpen={deploymentModesPanelOpen}
          onClose={() => setDeploymentModesPanelOpen(false)}
          isDetached={isDetached}
        />
      </ContentContainer>
    </PageContainer>
  );
};

// Layout
const PageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  padding: "32px 120px",
  minHeight: "calc(100vh - 72px)",
  [theme.breakpoints.down("lg")]: {
    padding: "24px 48px",
  },
  [theme.breakpoints.down("md")]: {
    padding: "20px 24px",
  },
  [theme.breakpoints.down("sm")]: {
    padding: "16px 12px",
  },
}));

const ContentContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "1024px",
  maxWidth: "100%",
});

const LoadingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "400px",
});

// Title
const TitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "32px 8px 12px 8px",
  [theme.breakpoints.down("sm")]: {
    padding: "20px 4px 10px 4px",
  },
}));

const PageTitle = styled("h1")(({ theme }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "24px",
  fontWeight: 500,
  fontStyle: "italic",
  lineHeight: "32px",
  color: canonHeaderTokens.foreground.accent0,
  margin: 0,
  [theme.breakpoints.down("sm")]: {
    fontSize: "20px",
    lineHeight: "28px",
  },
}));

const HelpIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  "&:hover": {
    opacity: 0.8,
  },
});

// Section Label
const SectionLabel = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  padding: "8px",
  margin: 0,
  textTransform: "uppercase",
});

// Safe Profile Card
const SafeProfileCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const SafeProfileRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "24px",
  gap: "16px",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: "16px",
  },
}));

const BaseCardLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  minWidth: 0,
  [theme.breakpoints.down("sm")]: {
    alignItems: "flex-start",
  },
}));

const SafeProfileLeft = styled(BaseCardLeft)({});

const SettingCardLeft = styled(BaseCardLeft)({});

const SafeIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  padding: "16px",
  borderRadius: "12px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
});

const SafeInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const SafeAddressRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
});

const SafeLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  wordBreak: "break-all",
});

const ChainRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const ChainName = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

// Config Stats
const ConfigStatsRow = styled(Box)(({ theme }) => ({
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
  padding: "24px",
  [theme.breakpoints.down("sm")]: {
    padding: "16px",
  },
}));

const ConfigStatsContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "32px",
  [theme.breakpoints.down("sm")]: {
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: "12px",
  },
}));

const ConfigStat = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  [theme.breakpoints.down("sm")]: {
    width: "calc(50% - 6px)",
    minWidth: "140px",
  },
}));

const ConfigStatValue = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const ConfigStatText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: "#ffffff",
});

const ConfigStatLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ConfigDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  height: "40px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

// Status Dot
const StatusDot = styled("div")<{ $color: string }>(({ $color }) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: $color,
}));

// Buttons
const OutlineButton = styled("button")<{ $width?: string; $disabled?: boolean }>(({ $width, $disabled, theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "36px",
  width: $width || "226px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  background: "transparent",
  cursor: $disabled ? "not-allowed" : "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: $disabled ? canonHeaderTokens.foreground.accent30 : canonHeaderTokens.foreground.accent10,
  opacity: $disabled ? 0.6 : 1,
  "&:hover": {
    backgroundColor: $disabled ? "transparent" : `${canonHeaderTokens.foreground.accent40}20`,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

// Setting Cards
const SettingCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
  gap: "12px",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: "16px",
  },
}));

const IconCircle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  minWidth: "48px",
  minHeight: "48px",
  flexShrink: 0,
  aspectRatio: "1 / 1",
  borderRadius: "50%",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  [theme.breakpoints.down("sm")]: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    minHeight: "44px",
  },
}));

const EmergencyIconCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive, theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  minWidth: "48px",
  minHeight: "48px",
  flexShrink: 0,
  aspectRatio: "1 / 1",
  borderRadius: "50%",
  backgroundColor: $isActive ? "#DA2828" : "transparent",
  border: $isActive ? "none" : `1px solid ${canonHeaderTokens.foreground.accent40}`,
  [theme.breakpoints.down("sm")]: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    minHeight: "44px",
  },
}));

const SettingInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: 0,
});

const SettingTitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
});

const SettingTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: "#ffffff",
});

const StatusIndicator = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const StatusLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: "#ffffff",
});

const SettingDescription = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  margin: 0,
});

// Canon Guard Card (with additional address row)
const CanonGuardCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
  gap: "20px",
  [theme.breakpoints.down("sm")]: {
    padding: "16px",
  },
}));

const CanonGuardTop = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

const LearnMoreLink = styled("button")({
  display: "inline",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textDecoration: "underline",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
  "&:hover": {
    opacity: 0.8,
  },
});

const CardDivider = styled(Box)({
  width: "100%",
  height: "1px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

const GuardAddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  wordBreak: "break-all",
});
