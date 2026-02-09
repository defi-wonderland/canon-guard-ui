/**
 * ManageSafesSection - Page for managing saved Safe accounts
 *
 * Shows:
 * - Currently active safe with profile and chain info
 * - Button to add a new safe
 * - Previously used safes that can be switched to
 */

import { useCallback, useEffect, useState } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Address } from "viem";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { SafeAccountCard } from "~/components/shared/SafeAccountCard";
import {
  PageContainer,
  SetupContentArea,
  SetupFormWrapper,
  SetupSectionTitle,
} from "~/components/shared/StyledComponents";
import { SupportedChainId, getRpcUrlForChain, getViemChain } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useSafeStorage, useWallet } from "~/hooks";
import { ClientService, SafeService, SavedSafe, SafeStorageService } from "~/services";
import { SafeInfo } from "~/types";

export const ManageSafesSection = () => {
  const navigate = useNavigate();
  const { currentSafe, previousSafes, refresh } = useSafeStorage();
  const { address: connectedAddress, isConnected } = useWallet();

  const [currentSafeInfo, setCurrentSafeInfo] = useState<SafeInfo | null>(null);
  const [previousSafesInfo, setPreviousSafesInfo] = useState<Map<string, SafeInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load safe info for all safes
  useEffect(() => {
    const loadSafeInfo = async () => {
      setIsLoading(true);

      try {
        // Load current safe info
        if (currentSafe) {
          const info = await fetchSafeInfo(currentSafe.address, currentSafe.chainId);
          setCurrentSafeInfo(info);
        }

        // Load previous safes info
        const infoMap = new Map<string, SafeInfo>();
        for (const safe of previousSafes) {
          const key = SafeStorageService.getSafeKey(safe.address, safe.chainId);
          const info = await fetchSafeInfo(safe.address, safe.chainId);
          if (info) {
            infoMap.set(key, info);
          }
        }
        setPreviousSafesInfo(infoMap);
      } catch (error) {
        console.error("Failed to load safe info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSafeInfo();
  }, [currentSafe, previousSafes]);

  const checkIsSigner = (safeInfo: SafeInfo | null | undefined): boolean => {
    if (!isConnected || !connectedAddress || !safeInfo) return false;
    return safeInfo.owners.some((owner) => owner.toLowerCase() === connectedAddress.toLowerCase());
  };

  const fetchSafeInfo = async (address: Address, chainId: SupportedChainId): Promise<SafeInfo | null> => {
    try {
      const rpcUrl = getRpcUrlForChain(chainId);
      const chain = getViemChain(chainId);
      const clientService = new ClientService(rpcUrl, chain);
      const safeService = new SafeService(clientService);
      return await safeService.getSafeInfo(address);
    } catch (error) {
      console.error(`Failed to fetch info for safe ${address}:`, error);
      return null;
    }
  };

  const handleAddNewSafe = useCallback(() => {
    // Navigate to root with a flag to force showing setup modal
    navigate("/?addNew=true");
  }, [navigate]);

  const handleSwitchSafe = useCallback(
    (safe: SavedSafe) => {
      // Set as current safe and navigate
      SafeStorageService.setCurrentSafe(safe.address, safe.chainId);
      refresh();

      // Build URL params
      const params = new URLSearchParams({
        safeAddress: safe.address,
        chainId: String(safe.chainId),
      });

      if (safe.guardAddress) {
        params.set("guardAddress", safe.guardAddress);
      }

      navigate(`/?${params.toString()}`);
    },
    [navigate, refresh],
  );

  const handleCurrentSafeClick = useCallback(() => {
    if (currentSafe) {
      // Build URL params
      const params = new URLSearchParams({
        safeAddress: currentSafe.address,
        chainId: String(currentSafe.chainId),
      });

      if (currentSafe.guardAddress) {
        params.set("guardAddress", currentSafe.guardAddress);
      }

      navigate(`/?${params.toString()}`);
    }
  }, [currentSafe, navigate]);

  const handleLogoClick = useCallback(() => {
    // Go back to main app
    if (currentSafe) {
      handleCurrentSafeClick();
    } else {
      navigate("/");
    }
  }, [currentSafe, handleCurrentSafeClick, navigate]);

  if (isLoading) {
    return (
      <PageContainer>
        <Header isMinimalMode onClearConfig={handleLogoClick} />
        <LoadingContainer>
          <CircularProgress size={32} sx={{ color: canonHeaderTokens.foreground.accent20 }} />
        </LoadingContainer>
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer data-testid='manage-safes-page'>
      <Header isMinimalMode onClearConfig={handleLogoClick} />

      <SetupContentArea>
        <SetupFormWrapper>
          {/* Currently Using Section */}
          {currentSafe && (
            <Section data-testid='current-safe-section'>
              <SetupSectionTitle>Currently Using</SetupSectionTitle>
              <SafeAccountCard
                address={currentSafe.address}
                chainId={currentSafe.chainId}
                queueCount={0} // TODO: Load actual queue count
                threshold={currentSafeInfo?.threshold}
                totalSigners={currentSafeInfo?.totalOwners}
                isSigner={checkIsSigner(currentSafeInfo)}
                isCurrentSafe
                onClick={handleCurrentSafeClick}
                testId='current-safe-card'
              />

              {/* Add New Safe Button */}
              <ButtonContainer>
                <AddNewButton onClick={handleAddNewSafe} data-testid='add-new-safe-button'>
                  Add New Safe
                </AddNewButton>
              </ButtonContainer>
            </Section>
          )}

          {/* No Current Safe - Show Add Button */}
          {!currentSafe && (
            <Section>
              <SetupSectionTitle>Get Started</SetupSectionTitle>
              <EmptyStateCard>
                <EmptyStateText>No safe accounts saved yet. Add your first safe to get started.</EmptyStateText>
                <AddNewButton onClick={handleAddNewSafe}>Add New Safe</AddNewButton>
              </EmptyStateCard>
            </Section>
          )}

          {/* Previously Used Section */}
          {previousSafes.length > 0 && (
            <Section data-testid='previous-safes-section'>
              <SetupSectionTitle>Previously Used Safe Accounts</SetupSectionTitle>
              <SafesList data-testid='previous-safes-list'>
                {previousSafes.map((safe, index) => {
                  const key = SafeStorageService.getSafeKey(safe.address, safe.chainId);
                  const info = previousSafesInfo.get(key);

                  return (
                    <SafeAccountCard
                      key={key}
                      address={safe.address}
                      chainId={safe.chainId}
                      queueCount={0} // TODO: Load actual queue count
                      threshold={info?.threshold}
                      totalSigners={info?.totalOwners}
                      isSigner={checkIsSigner(info)}
                      onClick={() => handleSwitchSafe(safe)}
                      testId={`previous-safe-card-${index}`}
                    />
                  );
                })}
              </SafesList>
            </Section>
          )}
        </SetupFormWrapper>
      </SetupContentArea>
      <Footer />
    </PageContainer>
  );
};

// Styled Components
const Section = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
});

const SafesList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const ButtonContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  padding: "12px",
});

const AddNewButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "36px",
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
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.foreground.accent40}20`,
  },
});

const EmptyStateCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  alignItems: "center",
  padding: "32px 24px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const EmptyStateText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  textAlign: "center",
  margin: 0,
});

const LoadingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
});
