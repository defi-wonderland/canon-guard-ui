import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Button, styled } from "@mui/material";
import { useCanonGuardService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { CanonVaultData, SafeInfo, TabType } from "~/types";
import { QueueSection } from "./QueueSection";
import { SafeSidebar } from "./SafeSidebar";
import { SafePageContainer, SafeMainContent } from "./shared/StyledComponents";

const TAB_CONTENT_MAP = {
  [TabType.QUEUE]: (canonVaultData: CanonVaultData) => {
    return <QueueSection canonVaultData={canonVaultData} />;
  },
  [TabType.PRE_APPROVED]: () => <ComingSoonMessage variant='h6'>Pre-approved actions coming soon...</ComingSoonMessage>,
  [TabType.HISTORY]: () => <ComingSoonMessage variant='h6'>Execution history coming soon...</ComingSoonMessage>,
  [TabType.CONFIGURATION]: () => (
    <ComingSoonMessage variant='h6'>Configuration details coming soon...</ComingSoonMessage>
  ),
  [TabType.ACTIONS]: () => <ComingSoonMessage variant='h6'>Action creation coming soon...</ComingSoonMessage>,
};

interface CanonVaultContentProps {
  canonVaultData: CanonVaultData;
  activeTab: TabType;
}

const CanonVaultContent = ({ canonVaultData, activeTab }: CanonVaultContentProps) => {
  const renderTabContent = TAB_CONTENT_MAP[activeTab];
  return renderTabContent ? renderTabContent(canonVaultData) : null;
};

interface CanonGuardVaultProps {
  safeInfo: SafeInfo;
  onClearVaultConfig: () => void;
}

export const CanonGuardVault = ({ safeInfo, onClearVaultConfig }: CanonGuardVaultProps) => {
  const canonGuardService = useCanonGuardService();
  const { clearVaultConfig } = useStateContext();

  const [canonVaultData, setCanonVaultData] = useState<CanonVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.QUEUE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleLoadCanonGuardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!safeInfo.guardAddress) {
        throw new Error("Guard address is required for Canon Guard operations");
      }

      const data = await canonGuardService.getCanonVaultData(safeInfo.guardAddress, safeInfo.threshold);
      const updatedCanonVaultData = { safeInfo, ...data };

      setCanonVaultData(updatedCanonVaultData);
    } catch (err) {
      console.error("Failed to load Canon Guard data:", err);
      setError("Failed to load Canon Guard data");
      setCanonVaultData(null);
    } finally {
      setLoading(false);
    }
  }, [safeInfo, canonGuardService]);

  useEffect(() => {
    handleLoadCanonGuardData();
  }, [handleLoadCanonGuardData]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
        <Typography color='text.secondary'>Loading Canon Guard data...</Typography>
      </LoadingContainer>
    );
  }

  if (error || !canonVaultData) {
    return (
      <ErrorContainer>
        <ErrorTitle variant='h5'>Connection Issue</ErrorTitle>
        <ErrorText>
          We couldn't load the Canon Guard data from your Safe. This might be due to network issues or the Canon Guard
          configuration may have changed.
        </ErrorText>
        <Button variant='contained' onClick={clearVaultConfig}>
          Change Setup
        </Button>
      </ErrorContainer>
    );
  }

  return (
    <SafePageContainer>
      <SafeSidebar
        safeInfo={canonVaultData.safeInfo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onClearVaultConfig={onClearVaultConfig}
      />
      <SafeMainContent sidebarCollapsed={sidebarCollapsed}>
        <CanonVaultContent canonVaultData={canonVaultData} activeTab={activeTab} />
      </SafeMainContent>
    </SafePageContainer>
  );
};

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  flexDirection: "column",
  padding: theme.spacing(4),
  maxWidth: theme.spacing(75),
  margin: "0 auto",
  textAlign: "center",
}));

const ErrorTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginBottom: theme.spacing(1),
}));

const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
  lineHeight: 1.6,
}));

const ComingSoonMessage = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: theme.spacing(50),
  color: theme.palette.text.secondary,
  fontStyle: "italic",
}));
