import { Box, styled } from "@mui/material";
import { XIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams } from "~/hooks";

interface DeploymentModesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDetached: boolean;
}

/**
 * Deployment Modes Panel - displays information about attached vs. detached
 * deployment modes for Canon Guard. Shows an "Attach Canon Guard" button
 * when in detached mode.
 */
export const DeploymentModesPanel = ({ isOpen, onClose, isDetached }: DeploymentModesPanelProps) => {
  const navigateWithParams = useNavigateWithParams();

  const handleAttachGuard = () => {
    navigateWithParams("/settings/attach");
    onClose();
  };

  return (
    <>
      <DrawerOverlay $isOpen={isOpen} onClick={onClose} />
      <DrawerPanel $isOpen={isOpen} data-testid='deployment-modes-panel'>
        <PanelContent>
          {/* Close button */}
          <CloseButton onClick={onClose} data-testid='close-panel-button'>
            <XIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          </CloseButton>

          {/* Inner wrapper with padding */}
          <InnerWrapper>
            {/* Title */}
            <PanelTitle>Deployment modes:{"\n"}Attached vs. Detached</PanelTitle>

            {/* Introduction */}
            <DescriptionText>You can adopt Canon Guard in two modes.</DescriptionText>

            {/* Detached explanation */}
            <DescriptionText>
              <BoldText>Detached</BoldText> (no Safe guard): You do not call setGuard. Teams use Canon Guard to
              queue/approve/execute, but the Safe does not enforce it. If Canon Guard has a bug, you can stop using it
              with no impact on the Safe. This is useful for an initial trial while you validate procedures.
            </DescriptionText>

            {/* Attached explanation */}
            <DescriptionText>
              <BoldText>Attached</BoldText> (Safe guard set): You call setGuard(CanonGuard). The Safe enforces "only
              Canon Guard may execute". This closes bypasses and makes approvals uniformly onchain. Risk: a
              misconfiguration (wrong guard address, incompatible Safe version, or broken guard) can block execution
              until the guard is changed.
            </DescriptionText>

            {/* Recommended rollout */}
            <DescriptionText>
              A recommended rollout would be starting detached for a few weeks, verify builders/hubs and team workflow,
              then attach. Keep a rollback prepared (for example, an action from ChangeSafe GuardActionFactory) to reset
              the guard if needed.
            </DescriptionText>

            {/* Attach button - only shown when in detached mode */}
            {isDetached && (
              <AttachButton onClick={handleAttachGuard} data-testid='attach-guard-button'>
                Attach Canon Guard
              </AttachButton>
            )}
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
})<{ $isOpen: boolean }>(({ $isOpen, theme }) => ({
  position: "fixed",
  top: "12px",
  right: "12px",
  bottom: "12px",
  left: "auto",
  width: "496px",
  maxWidth: "calc(100vw - 24px)",
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
  [theme.breakpoints.down("sm")]: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100vw",
    maxWidth: "100vw",
    borderRadius: 0,
    transform: $isOpen ? "translateX(0)" : "translateX(100%)",
  },
}));

const PanelContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  padding: "24px",
  position: "relative",
  overflowY: "auto",
  overflowX: "hidden",
  [theme.breakpoints.down("sm")]: {
    padding: "16px",
  },
}));

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

// Inner wrapper with padding containing all content
const InnerWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "16px",
  [theme.breakpoints.down("sm")]: {
    padding: "12px",
  },
}));

const PanelTitle = styled("h2")(({ theme }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
  margin: 0,
  whiteSpace: "pre-line",
  [theme.breakpoints.down("sm")]: {
    fontSize: "18px",
    lineHeight: "24px",
  },
}));

const DescriptionText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  margin: 0,
});

const BoldText = styled("span")({
  fontWeight: 700,
  color: canonHeaderTokens.foreground.accent10,
});

// Attach Button (Primary green style)
const AttachButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "44px",
  padding: "8px 20px",
  marginTop: "16px",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.brand.green,
  border: "none",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#FFFFFF",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.9,
  },
});
