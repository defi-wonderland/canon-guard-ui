import { useState, useEffect, useCallback } from "react";
import { Box, styled } from "@mui/material";
import { useLocation, Navigate } from "react-router-dom";
import { Address } from "viem";
import { getChainConfig } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useCanonGuardConfig } from "~/hooks/useCanonGuardConfig";
import { useQueueService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { CanonGuardConfigProvider } from "~/providers/CanonGuardConfigProvider";
import { SafeInfo } from "~/types";
import { CanonListSection } from "./CanonListSection";
import { ChangeGuardSection } from "./ChangeGuardSection";
import { CreateSection } from "./CreateSection";
import { DeploymentModesPanel } from "./DeploymentModesPanel";
import { DetachedModeBanner } from "./DetachedModeBanner";
import { EmergencyModeBanner } from "./EmergencyModeBanner";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { QueueActionSection } from "./QueueActionSection";
import { QueueSection } from "./QueueSection";
import { QueueSignSection } from "./QueueSignSection";
import { SettingsSection } from "./SettingsSection";

interface CanonGuardAppProps {
  safeInfo: SafeInfo;
  onClearConfig: () => void;
}

/**
 * Inner component that consumes the Canon Guard config context.
 * Separated to ensure context is available when hooks are called.
 */
const CanonGuardAppInner = ({ safeInfo, onClearConfig }: CanonGuardAppProps) => {
  const queueService = useQueueService();
  const { chainId, guardAddress, isDetached } = useStateContext();
  const { emergencyMode } = useCanonGuardConfig();
  const location = useLocation();

  const [queueCount, setQueueCount] = useState(0);
  const [isDeploymentModesPanelOpen, setIsDeploymentModesPanelOpen] = useState(false);

  const chainConfig = getChainConfig(chainId);

  // Fetch queue count for navbar
  const fetchQueueCount = useCallback(async () => {
    if (!guardAddress) return;
    try {
      const count = await queueService.getQueueCount(guardAddress as Address);
      setQueueCount(count);
    } catch (error) {
      console.error("Failed to fetch queue count:", error);
    }
  }, [queueService, guardAddress]);

  useEffect(() => {
    fetchQueueCount();
  }, [fetchQueueCount]);

  // Callback to update queue count when items change
  const handleQueueCountChange = useCallback((count: number) => {
    setQueueCount(count);
  }, []);

  // Determine which content to render based on route
  const renderContent = () => {
    const path = location.pathname;

    // Attach/Detach Guard flow (must come before /settings check)
    if (path === "/settings/attach") {
      return <ChangeGuardSection mode='attach' onQueueCountChange={fetchQueueCount} />;
    }
    if (path === "/settings/detach") {
      return <ChangeGuardSection mode='detach' onQueueCountChange={fetchQueueCount} />;
    }

    // Settings page
    if (path === "/settings") {
      return <SettingsSection />;
    }

    // Queue is the default when at root or /queue
    if (path === "/" || path === "/queue") {
      return <QueueSection safeOwners={safeInfo.owners} onQueueCountChange={handleQueueCountChange} />;
    }

    // Queue Sign (from Queue item Sign button)
    if (path === "/queue/sign") {
      return <QueueSignSection onQueueCountChange={fetchQueueCount} />;
    }

    // Queue Action (from Canon List)
    if (path === "/queue-action") {
      return <QueueActionSection onQueueCountChange={fetchQueueCount} />;
    }

    // Canon List
    if (path === "/canon-list") {
      return <CanonListSection safeInfo={safeInfo} onQueueCountChange={fetchQueueCount} />;
    }

    // Create routes - render CreateSection which handles its own nested routing
    if (path.startsWith("/create")) {
      return <CreateSection onQueueCountChange={fetchQueueCount} />;
    }

    // Default to queue for unknown routes
    return <Navigate to='/queue' replace />;
  };

  // Handle Learn More click - open deployment modes panel
  const handleDetachedLearnMore = useCallback(() => {
    setIsDeploymentModesPanelOpen(true);
  }, []);

  // Handle closing the deployment modes panel
  const handleCloseDeploymentModesPanel = useCallback(() => {
    setIsDeploymentModesPanelOpen(false);
  }, []);

  return (
    <PageContainer>
      {/* Emergency mode takes priority over detached mode */}
      {emergencyMode === true ? (
        <EmergencyModeBanner isActive={true} />
      ) : isDetached ? (
        <DetachedModeBanner isActive={true} onLearnMore={handleDetachedLearnMore} />
      ) : null}
      <Header
        safeAddress={safeInfo.address}
        chain={chainConfig.chain}
        queueCount={queueCount}
        onClearConfig={onClearConfig}
      />
      <MainContent>{renderContent()}</MainContent>

      {/* Deployment Modes Panel */}
      <DeploymentModesPanel
        isOpen={isDeploymentModesPanelOpen}
        onClose={handleCloseDeploymentModesPanel}
        isDetached={isDetached}
      />
      <Footer />
    </PageContainer>
  );
};

/**
 * Main Canon Guard App component.
 * Wraps the inner component with the CanonGuardConfigProvider
 * to provide shared config state to all child components.
 */
export const CanonGuardApp = ({ safeInfo, onClearConfig }: CanonGuardAppProps) => {
  return (
    <CanonGuardConfigProvider>
      <CanonGuardAppInner safeInfo={safeInfo} onClearConfig={onClearConfig} />
    </CanonGuardConfigProvider>
  );
};

const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const MainContent = styled(Box)({
  flex: 1,
  overflow: "auto",
  backgroundColor: canonHeaderTokens.background.layer0,
});
