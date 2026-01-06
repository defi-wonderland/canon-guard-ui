import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, CircularProgress, styled } from "@mui/material";
import { flushSync } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Address, isAddress } from "viem";
import { CanonGuardApp } from "~/components/CanonGuardApp";
import { ErrorState } from "~/components/ErrorState";
import { GuardSetupWizard } from "~/components/GuardSetupWizard";
import { VaultSetupModal } from "~/components/VaultSetupModal";
import { SupportedChainId, parseChainId, getRpcUrlForChain, getViemChain } from "~/config/chains";
import { useStateContext } from "~/hooks/useStateContext";
import { ClientService, SafeService } from "~/services";
import { SafeInfo } from "~/types";

type ViewState = "setup" | "loading" | "error" | "ready";

export const SafeVault = () => {
  const { setSafeAddress, setChainId, setGuardAddress, clearConfig } = useStateContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [viewState, setViewState] = useState<ViewState>("setup");

  // Track if we've initialized from URL params
  const initializedRef = useRef(false);

  // Initialize from URL params on mount only
  useEffect(() => {
    if (initializedRef.current) return;

    const safeAddressParam = searchParams.get("safeAddress");
    const chainIdParam = searchParams.get("chainId");

    if (safeAddressParam && isAddress(safeAddressParam)) {
      const parsedChainId = parseChainId(chainIdParam);

      if (parsedChainId) {
        initializedRef.current = true;
        setSafeAddress(safeAddressParam as Address);
        setChainId(parsedChainId);
        setViewState("loading");

        // Create a fresh service for the correct chain to avoid stale closure issues
        const loadWithCorrectChain = async () => {
          try {
            const rpcUrl = getRpcUrlForChain(parsedChainId);
            const chain = getViemChain(parsedChainId);
            const clientService = new ClientService(rpcUrl, chain);
            const freshSafeService = new SafeService(clientService);

            const info = await freshSafeService.getSafeInfo(safeAddressParam as Address);
            setSafeInfo(info);
            if (info.guardAddress) {
              setGuardAddress(info.guardAddress);
            }
            setViewState("ready");
          } catch (error) {
            console.error("Failed to load Safe info:", error);
            setSafeInfo(null);
            setViewState("error");
          }
        };

        loadWithCorrectChain();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetupSubmit = useCallback(
    async (address: Address, selectedChainId: SupportedChainId) => {
      setSafeAddress(address);
      setChainId(selectedChainId);
      setSearchParams({
        safeAddress: address,
        chainId: String(selectedChainId),
      });
      setViewState("loading");

      // Create a fresh service for the selected chain to avoid stale closure issues
      try {
        const rpcUrl = getRpcUrlForChain(selectedChainId);
        const chain = getViemChain(selectedChainId);
        const clientService = new ClientService(rpcUrl, chain);
        const freshSafeService = new SafeService(clientService);

        const info = await freshSafeService.getSafeInfo(address);
        setSafeInfo(info);
        if (info.guardAddress) {
          setGuardAddress(info.guardAddress);
        }
        setViewState("ready");
      } catch (error) {
        console.error("Failed to load Safe info:", error);
        setSafeInfo(null);
        setViewState("error");
      }
    },
    [setSafeAddress, setChainId, setSearchParams, setGuardAddress],
  );

  const handleClearConfig = useCallback(() => {
    // Clear URL params first using history API to avoid react-router re-renders
    window.history.replaceState({}, "", "/");

    // Reset everything and go back to setup
    initializedRef.current = false;

    // Use flushSync to ensure state updates happen synchronously
    flushSync(() => {
      clearConfig();
      setSafeInfo(null);
      setViewState("setup");
    });
  }, [clearConfig]);

  // Show setup modal
  if (viewState === "setup") {
    return <VaultSetupModal open onSubmit={handleSetupSubmit} />;
  }

  // Show loading state
  if (viewState === "loading") {
    return (
      <LoadingContainer>
        <CircularProgress />
        <LoadingText variant='h6'>Loading Safe info...</LoadingText>
      </LoadingContainer>
    );
  }

  // Handle error - couldn't connect to Safe
  if (viewState === "error" || !safeInfo) {
    return (
      <ErrorState
        title='Invalid Safe'
        message='The address provided is not a valid Safe on this network.'
        onChangeSetup={handleClearConfig}
      />
    );
  }

  // Handle case where Safe has NO guard attached
  if (!safeInfo.hasGuard) {
    return <GuardSetupWizard safeInfo={safeInfo} onBack={handleClearConfig} />;
  }

  // Handle case where Safe has a guard but it's NOT a valid Canon Guard
  if (!safeInfo.isValidCanonGuard) {
    return (
      <ErrorState
        title='Unsupported Guard'
        message={`This Safe has a guard attached (${safeInfo.guardAddress}), but it was not deployed from a supported Canon Guard Factory. Canon Guard UI only works with guards deployed from the official factory.`}
        onChangeSetup={handleClearConfig}
      />
    );
  }

  // Everything is good - show the main Canon Guard App UI
  return <CanonGuardApp safeInfo={safeInfo} onClearConfig={handleClearConfig} />;
};

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));
