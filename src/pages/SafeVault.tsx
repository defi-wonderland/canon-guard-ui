import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, styled } from "@mui/material";
import { Address } from "viem";
import { QueueSection } from "~/components/QueueSection";
import { SafeSidebar } from "~/components/SafeSidebar";
import { VaultSetupModal } from "~/components/VaultSetupModal";
import { SafePageContainer, SafeMainContent } from "~/components/shared/StyledComponents";
import { useStateContext } from "~/hooks/useStateContext";
import { canonGuardService } from "~/services/canonGuardService";
import { VaultData, TabType } from "~/types/canon-guard";

// Tab content configuration
const TAB_CONTENT_MAP = {
  [TabType.QUEUE]: (vaultData: VaultData) => (
    <QueueSection
      queuedActions={vaultData.queuedTransactions}
      waitingForApprovalActions={vaultData.queuedTransactions.filter((tx) => tx.approversCount < tx.requiredApprovals)}
    />
  ),
  [TabType.PRE_APPROVED]: () => <ComingSoonMessage>Pre-approved actions coming soon...</ComingSoonMessage>,
  [TabType.HISTORY]: () => <ComingSoonMessage>History coming soon...</ComingSoonMessage>,
  [TabType.CONFIGURATION]: () => <ComingSoonMessage>Configuration coming soon...</ComingSoonMessage>,
  [TabType.ACTIONS]: () => <ComingSoonMessage>Action creation coming soon...</ComingSoonMessage>,
};

// Vault content component
interface VaultContentProps {
  vaultData: VaultData;
  activeTab: TabType;
}

const VaultContent = ({ vaultData, activeTab }: VaultContentProps) => {
  // Check if Safe is valid
  if (!vaultData.vaultInfo.hasCanonGuard) {
    return (
      <ErrorContainer>
        <ErrorMessage>This address is not a Canon Vault, please set it up and try again.</ErrorMessage>
      </ErrorContainer>
    );
  }

  const renderTabContent = TAB_CONTENT_MAP[activeTab];
  return renderTabContent ? renderTabContent(vaultData) : null;
};

interface SafeVaultProps {
  safeData?: VaultData;
}

export const SafeVault = ({ safeData }: SafeVaultProps) => {
  const { vaultAddress, rpcUrl, isVaultConfigured, setVaultAddress, setRpcUrl, loading, setLoading } =
    useStateContext();

  const [currentVaultData, setCurrentVaultData] = useState<VaultData | null>(safeData || null);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.QUEUE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const loadVaultData = useCallback(async () => {
    if (!vaultAddress || !rpcUrl) return;

    try {
      setLoading(true);
      const vaultData = await canonGuardService.getVaultData(vaultAddress);
      setCurrentVaultData(vaultData);
    } catch (error) {
      console.error("Failed to load vault data:", error);
      setCurrentVaultData(null);
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, rpcUrl, setLoading]);

  useEffect(() => {
    if (isVaultConfigured) {
      loadVaultData();
    }
  }, [isVaultConfigured, loadVaultData]);

  const handleSetupSubmit = (address: Address, rpc: string) => {
    setVaultAddress(address);
    setRpcUrl(rpc);
  };

  // Show setup modal if vault is not configured
  if (!isVaultConfigured) {
    return <VaultSetupModal open onSubmit={handleSetupSubmit} />;
  }

  // Show loading state
  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress size={48} />
        <LoadingText>Loading vault data...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <SafePageContainer>
      {currentVaultData && (
        <>
          <SafeSidebar
            safeInfo={currentVaultData.vaultInfo}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <SafeMainContent sidebarCollapsed={sidebarCollapsed}>
            <VaultContent vaultData={currentVaultData} activeTab={activeTab} />
          </SafeMainContent>
        </>
      )}
    </SafePageContainer>
  );
};

// Styled Components
const LoadingContainer = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  flexDirection: "column",
  gap: 16,
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  variant: "h6",
  color: theme.palette.text.secondary,
}));

const ErrorContainer = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  padding: 32,
}));

const ErrorMessage = styled(Typography)(({ theme }) => ({
  variant: "h6",
  color: theme.palette.error.main,
  textAlign: "center",
  maxWidth: 600,
}));

const ComingSoonMessage = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "400px",
  fontSize: "1.25rem",
  color: theme.palette.text.secondary,
  fontStyle: "italic",
}));
