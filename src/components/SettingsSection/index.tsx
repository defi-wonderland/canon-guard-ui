import { useState } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { EmergencyModePanel } from "~/components/EmergencyModePanel";
import {
  HelpCircleIcon,
  ShieldCheckIcon,
  AsteriskIcon,
  ShieldAlertIcon,
  Link2Icon,
  CopyIcon,
} from "~/components/icons";
import { getChainConfig } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useStateContext, useCanonGuardConfig, humanizeDuration } from "~/hooks";
import { truncateAddress } from "~/utils";

export const SettingsSection = () => {
  const { safeAddress, guardAddress, chainId } = useStateContext();
  const { shortTxExecutionDelay, longTxExecutionDelay, txExpiryDelay, maxApprovalDuration, emergencyMode, isLoading } =
    useCanonGuardConfig();

  const [emergencyPanelOpen, setEmergencyPanelOpen] = useState(false);

  const chainConfig = getChainConfig(chainId);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
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
          <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
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
                  <AddressWithCopy onClick={() => handleCopyAddress(safeAddress || "")}>
                    <AddressText>{truncateAddress(safeAddress || "")}</AddressText>
                    <CopyIcon size={10} color={canonHeaderTokens.foreground.accent30} />
                  </AddressWithCopy>
                </SafeAddressRow>
                <ChainName>{chainConfig?.chain.name || "Unknown Chain"}</ChainName>
              </SafeInfo>
            </SafeProfileLeft>
            <OutlineButton>MANAGE SAFE ACCOUNTS</OutlineButton>
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
          <OutlineButton $width='108px'>EDIT</OutlineButton>
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
                <StatusIndicator>
                  <StatusDot
                    $color={emergencyMode ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent30}
                  />
                  <StatusLabel>{emergencyMode ? "ON" : "OFF"}</StatusLabel>
                </StatusIndicator>
              </SettingTitleRow>
              <SettingDescription>Use this when keys are compromised or signers are under pressure.</SettingDescription>
            </SettingInfo>
          </SettingCardLeft>
          <OutlineButton $width='108px' onClick={() => setEmergencyPanelOpen(true)}>
            EDIT
          </OutlineButton>
        </SettingCard>

        {/* Emergency Mode Panel */}
        <EmergencyModePanel isOpen={emergencyPanelOpen} onClose={() => setEmergencyPanelOpen(false)} />

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
                  <StatusIndicator>
                    <StatusDot $color={canonHeaderTokens.brand.green} />
                    <StatusLabel>Attached</StatusLabel>
                  </StatusIndicator>
                </SettingTitleRow>
                <DescriptionWithLink>
                  <SettingDescription>
                    You can adopt Canon Guard in two modes: Attached and Detached.
                  </SettingDescription>
                  <LearnMoreLink>Learn more</LearnMoreLink>
                </DescriptionWithLink>
              </SettingInfo>
            </SettingCardLeft>
            <OutlineButton $width='108px'>DETACH</OutlineButton>
          </CanonGuardTop>
          <CardDivider />
          <GuardAddressRow>
            <GuardAddressText>{guardAddress || ""}</GuardAddressText>
            <CopyButtonSmall onClick={() => handleCopyAddress(guardAddress || "")}>
              <CopyIcon size={10} color={canonHeaderTokens.foreground.accent10} />
            </CopyButtonSmall>
          </GuardAddressRow>
        </CanonGuardCard>
      </ContentContainer>
    </PageContainer>
  );
};

// Layout
const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  padding: "32px 120px",
  minHeight: "calc(100vh - 72px)",
});

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
const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "32px 8px 12px 8px",
});

const PageTitle = styled("h1")({
  fontFamily: "Inter, sans-serif",
  fontSize: "24px",
  fontWeight: 500,
  fontStyle: "italic",
  lineHeight: "32px",
  color: canonHeaderTokens.foreground.accent0,
  margin: 0,
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

const SafeProfileRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "24px",
});

const SafeProfileLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

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
});

const SafeLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const AddressWithCopy = styled("button")({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: 0,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    opacity: 0.8,
  },
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const ChainName = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

// Config Stats
const ConfigStatsRow = styled(Box)({
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
  padding: "24px",
});

const ConfigStatsContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "32px",
});

const ConfigStat = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

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

const ConfigDivider = styled(Box)({
  width: "1px",
  height: "40px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

// Status Dot
const StatusDot = styled("div")<{ $color: string }>(({ $color }) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: $color,
}));

// Buttons
const OutlineButton = styled("button")<{ $width?: string }>(({ $width }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "36px",
  width: $width || "226px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.foreground.accent40}20`,
  },
}));

// Setting Cards
const SettingCard = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const SettingCardLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const IconCircle = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  borderRadius: "1000px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
});

const EmergencyIconCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  borderRadius: "1000px",
  backgroundColor: $isActive ? "#DA2828" : "transparent",
  border: $isActive ? "none" : `1px solid ${canonHeaderTokens.foreground.accent40}`,
}));

const SettingInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const SettingTitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
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
const CanonGuardCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
  gap: "20px",
});

const CanonGuardTop = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const DescriptionWithLink = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const LearnMoreLink = styled("button")({
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

const GuardAddressRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const GuardAddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const CopyButtonSmall = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  opacity: 0.3,
  "&:hover": {
    opacity: 0.6,
  },
});
