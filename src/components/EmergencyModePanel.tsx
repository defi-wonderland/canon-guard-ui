import { useState } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { useConfig } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { canonGuardAbi } from "~/abis/canonGuard";
import { XIcon, ShieldAlertIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useCanonGuardConfig, useWallet, useNavigateWithParams } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import type { Address } from "viem";

interface EmergencyModePanelProps {
  isOpen: boolean;
  onClose: () => void;
  testIdPrefix?: string;
}

export const EmergencyModePanel = ({ isOpen, onClose, testIdPrefix }: EmergencyModePanelProps) => {
  const config = useConfig();
  const navigateWithParams = useNavigateWithParams();
  const { guardAddress } = useStateContext();
  const { address: walletAddress } = useWallet();
  const { emergencyMode, emergencyTrigger, emergencyCaller, refetch } = useCanonGuardConfig();

  const [isActivating, setIsActivating] = useState(false);
  const buildTestId = (suffix: string) => (testIdPrefix ? `${testIdPrefix}-${suffix}` : suffix);

  // Permission checks
  const isTrigger =
    walletAddress && emergencyTrigger ? walletAddress.toLowerCase() === emergencyTrigger.toLowerCase() : false;
  const isCaller =
    walletAddress && emergencyCaller ? walletAddress.toLowerCase() === emergencyCaller.toLowerCase() : false;

  // Determine the panel state
  const isEmergencyOn = emergencyMode === true;
  const canActivate = !isEmergencyOn && isTrigger;
  const canDeactivate = isEmergencyOn && isCaller;
  const hasNoPermissions = !isTrigger && !isCaller;

  const handleActivateEmergencyMode = async () => {
    if (!guardAddress || isActivating) return;

    setIsActivating(true);
    try {
      // Submit the transaction
      const hash = await writeContract(config, {
        address: guardAddress as Address,
        abi: canonGuardAbi,
        functionName: "setEmergencyMode",
      });

      // Wait for the transaction to be confirmed
      await waitForTransactionReceipt(config, { hash });

      // Refetch shared config to update all components
      await refetch();
      onClose();
    } catch (error) {
      console.error("[EmergencyModePanel] Failed to activate emergency mode:", error);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivateEmergencyMode = () => {
    // Navigate to the Turn Off Emergency Mode signing flow
    navigateWithParams("/create/action/turn-off-emergency");
    onClose();
  };

  return (
    <>
      <DrawerOverlay $isOpen={isOpen} onClick={onClose} />
      <DrawerPanel $isOpen={isOpen} data-testid={buildTestId("emergency-mode-panel")}>
        <PanelContent>
          {/* Close button */}
          <CloseButton onClick={onClose} data-testid={buildTestId("emergency-mode-close-button")}>
            <XIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          </CloseButton>

          {/* Inner wrapper with 16px padding - contains everything */}
          <InnerWrapper>
            {/* Title */}
            <PanelTitle>Emergency Mode</PanelTitle>

            {/* Description */}
            <PanelDescription>
              Owners can still queue and approve, but only the designated Emergency Caller can execute or cancel while
              it's active.
            </PanelDescription>

            {/* Content Section */}
            <ContentSection>
              <Divider />

              {/* Status Section */}
              <StatusSection>
                <StatusIconWrapper $isActive={isEmergencyOn}>
                  <ShieldAlertIcon size={24} color={isEmergencyOn ? "#FFFFFF" : "#E1AB11"} />
                </StatusIconWrapper>
                <StatusInfo>
                  <StatusTitle data-testid={buildTestId("emergency-mode-panel-status-title")}>
                    Emergency Mode: {isEmergencyOn ? "ON" : "OFF"}
                  </StatusTitle>
                  <StatusSubtitle>Limit who can execute transactions</StatusSubtitle>
                </StatusInfo>
              </StatusSection>

              <Divider />

              {/* Emergency Trigger */}
              <AddressSection>
                <AddressLabel>Emergency Trigger</AddressLabel>
                {emergencyTrigger ? (
                  <CopyableText text={emergencyTrigger} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
                    <AddressText>{emergencyTrigger}</AddressText>
                  </CopyableText>
                ) : (
                  <AddressText>-</AddressText>
                )}
              </AddressSection>

              <Divider />

              {/* Emergency Caller */}
              <AddressSection>
                <AddressLabel>Emergency Caller</AddressLabel>
                {emergencyCaller ? (
                  <CopyableText text={emergencyCaller} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
                    <AddressText>{emergencyCaller}</AddressText>
                  </CopyableText>
                ) : (
                  <AddressText>-</AddressText>
                )}
              </AddressSection>

              <Divider />

              {/* Action Section - conditional based on permissions */}
              {hasNoPermissions && !isEmergencyOn && (
                <WarningBox>
                  <WarningText>You do not have permissions to manage emergency mode.</WarningText>
                </WarningBox>
              )}

              {canActivate && (
                <ActivateButton
                  onClick={handleActivateEmergencyMode}
                  disabled={isActivating}
                  data-testid={buildTestId("activate-emergency-mode-button")}
                >
                  {isActivating ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : "ACTIVATE EMERGENCY MODE"}
                </ActivateButton>
              )}

              {canDeactivate && (
                <DeactivateButton
                  onClick={handleDeactivateEmergencyMode}
                  data-testid={buildTestId("deactivate-emergency-mode-button")}
                >
                  TURN OFF EMERGENCY MODE
                </DeactivateButton>
              )}

              {isEmergencyOn && !isCaller && (
                <WarningBox>
                  <WarningText>Only the Emergency Caller can turn off emergency mode.</WarningText>
                </WarningBox>
              )}
            </ContentSection>
          </InnerWrapper>
        </PanelContent>
      </DrawerPanel>
    </>
  );
};

// Drawer Overlay
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

// Drawer Panel
const DrawerPanel = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})<{ $isOpen: boolean }>(({ $isOpen }) => ({
  position: "fixed",
  top: "12px",
  right: "12px",
  bottom: "12px",
  width: "496px",
  backgroundColor: canonHeaderTokens.background.layer1,
  transform: $isOpen ? "translateX(0)" : "translateX(calc(100% + 24px))",
  opacity: $isOpen ? 1 : 0,
  visibility: $isOpen ? "visible" : "hidden",
  pointerEvents: $isOpen ? "auto" : "none",
  transition: "transform 0.3s ease, opacity 0.2s ease, visibility 0.2s ease",
  zIndex: 1001,
  display: "flex",
  flexDirection: "column",
  boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.3)",
  borderRadius: "8px",
  overflow: "hidden",
}));

const PanelContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  padding: "24px",
  position: "relative",
});

const CloseButton = styled("button")({
  position: "absolute",
  top: "16px",
  right: "16px",
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

// Inner wrapper with 16px padding containing all content
const InnerWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "32px",
  padding: "16px",
});

const PanelTitle = styled("h2")({
  fontFamily: "Inter, sans-serif",
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
  margin: 0,
});

const PanelDescription = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  margin: 0,
  maxWidth: "295px",
});

const ContentSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
});

const Divider = styled(Box)({
  width: "100%",
  height: "0.5px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

// Status Section
const StatusSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const StatusIconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
  borderRadius: "100px",
  backgroundColor: $isActive ? "#DA2828" : "transparent",
  border: $isActive ? "none" : "1px solid rgba(225, 171, 17, 0.1)",
}));

const StatusInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const StatusTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
});

const StatusSubtitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

// Address Section
const AddressSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const AddressLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

// Warning Box
const WarningBox = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  height: "48px",
  borderRadius: "8px",
  backgroundColor: "rgba(225, 171, 17, 0.1)",
});

const WarningText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: "#E1AB11",
  textAlign: "center",
});

// Activate Button (Red solid)
const ActivateButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  backgroundColor: "#DA2828",
  border: "none",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#FFFFFF",
  transition: "opacity 0.2s ease",
  "&:hover:not(:disabled)": {
    opacity: 0.9,
  },
  "&:disabled": {
    opacity: 0.7,
    cursor: "not-allowed",
  },
});

// Deactivate Button (Red outlined)
const DeactivateButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  backgroundColor: "rgba(218, 40, 40, 0.2)",
  border: "1px solid rgba(218, 40, 40, 0.5)",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#DA2828",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});
