import { useState, useEffect, useCallback } from "react";
import { Box, styled } from "@mui/material";
import { useLocation, Navigate } from "react-router-dom";
import { Address } from "viem";
import { getChainConfig } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { CanonGuardConfigProvider } from "~/contexts";
import { useCanonGuardConfig } from "~/hooks/useCanonGuardConfig";
import { useQueueService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { SafeInfo } from "~/types";
import { CanonListSection } from "./CanonListSection";
import { CreateSection } from "./CreateSection";
import { EmergencyModeBanner } from "./EmergencyModeBanner";
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
  const { chainId, guardAddress } = useStateContext();
  const { emergencyMode } = useCanonGuardConfig();
  const location = useLocation();

  const [queueCount, setQueueCount] = useState(0);

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
      return <QueueSignSection />;
    }

    // Queue Action (from Canon List)
    if (path === "/queue-action") {
      return <QueueActionSection />;
    }

    // Canon List
    if (path === "/canon-list") {
      return <CanonListSection safeInfo={safeInfo} />;
    }

    // Create routes - render CreateSection which handles its own nested routing
    if (path.startsWith("/create")) {
      return <CreateSection />;
    }

    // Default to queue for unknown routes
    return <Navigate to='/queue' replace />;
  };

  return (
    <PageContainer>
      <EmergencyModeBanner isActive={emergencyMode === true} />
      <Header
        safeAddress={safeInfo.address}
        chain={chainConfig.chain}
        queueCount={queueCount}
        onClearConfig={onClearConfig}
      />
      <MainContent>{renderContent()}</MainContent>
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
