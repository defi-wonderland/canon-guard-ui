import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, CircularProgress, styled } from "@mui/material";
import { flushSync } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Address, isAddress } from "viem";
import { useSwitchChain } from "wagmi";
import { CanonGuardApp } from "~/components/CanonGuardApp";
import { DetachedGuardInput } from "~/components/DetachedGuardInput";
import { ErrorState } from "~/components/ErrorState";
import { GuardSetupWizard } from "~/components/GuardSetupWizard";
import { NoGuardChoiceScreen } from "~/components/NoGuardChoiceScreen";
import { VaultSetupModal } from "~/components/VaultSetupModal";
import { SupportedChainId, parseChainId, getRpcUrlForChain, getViemChain } from "~/config/chains";
import { useStateContext } from "~/hooks/useStateContext";
import { ClientService, SafeService, CanonGuardValidationService } from "~/services";
import { SafeInfo } from "~/types";

type ViewState = "setup" | "loading" | "error" | "ready" | "no-guard-choice" | "detached-input" | "deploy-wizard";

// Helper to determine initial view state based on URL params
const getInitialViewState = (searchParams: URLSearchParams): ViewState => {
  const safeAddressParam = searchParams.get("safeAddress");
  const chainIdParam = searchParams.get("chainId");

  // If we have valid URL params, start in loading state to avoid flicker
  if (safeAddressParam && isAddress(safeAddressParam) && parseChainId(chainIdParam)) {
    return "loading";
  }

  return "setup";
};

export const SafeVault = () => {
  const { setSafeAddress, setChainId, setGuardAddress, setIsDetached, clearConfig } = useStateContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { switchChainAsync } = useSwitchChain();
  const navigate = useNavigate();

  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  // Initialize viewState based on URL params to avoid flicker
  const [viewState, setViewState] = useState<ViewState>(() => getInitialViewState(searchParams));

  // Track if we've initialized from URL params
  const initializedRef = useRef(false);

  // Initialize from URL params on mount only
  useEffect(() => {
    if (initializedRef.current) return;

    const safeAddressParam = searchParams.get("safeAddress");
    const chainIdParam = searchParams.get("chainId");
    const guardAddressParam = searchParams.get("guardAddress");

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

            // Case D: URL has guardAddress param - validate and use detached mode
            if (guardAddressParam && isAddress(guardAddressParam) && !info.hasGuard) {
              const validationService = new CanonGuardValidationService(clientService.getClient());
              const isValid = await validationService.isValidCanonGuard(guardAddressParam as Address);

              if (isValid) {
                setGuardAddress(guardAddressParam as Address);
                setIsDetached(true);
                setViewState("ready");
                return;
              }
              // If invalid, fall through to normal flow
            }

            // Case A: Safe has valid attached guard
            if (info.hasGuard && info.isValidCanonGuard && info.guardAddress) {
              setGuardAddress(info.guardAddress);
              setIsDetached(false);
              setViewState("ready");
              return;
            }

            // Case B: Safe has invalid guard (not Canon Guard)
            if (info.hasGuard && !info.isValidCanonGuard) {
              setViewState("error");
              return;
            }

            // Case C: Safe has no guard - show choice screen
            if (!info.hasGuard) {
              setViewState("no-guard-choice");
              return;
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
      // Create a fresh service for the selected chain to avoid stale closure issues
      try {
        const rpcUrl = getRpcUrlForChain(selectedChainId);
        const chain = getViemChain(selectedChainId);
        const clientService = new ClientService(rpcUrl, chain);
        const freshSafeService = new SafeService(clientService);
        await switchChainAsync({ chainId: selectedChainId });

        const info = await freshSafeService.getSafeInfo(address);

        // Only update state after successful fetch - VaultSetupModal shows loading on button
        setSafeAddress(address);
        setChainId(selectedChainId);
        setSearchParams({
          safeAddress: address,
          chainId: String(selectedChainId),
        });
        setSafeInfo(info);

        // Case A: Safe has valid attached guard
        if (info.hasGuard && info.isValidCanonGuard && info.guardAddress) {
          setGuardAddress(info.guardAddress);
          setIsDetached(false);
          setViewState("ready");
          return;
        }

        // Case B: Safe has invalid guard (not Canon Guard)
        if (info.hasGuard && !info.isValidCanonGuard) {
          setViewState("error");
          return;
        }

        // Case C: Safe has no guard - show choice screen
        if (!info.hasGuard) {
          setViewState("no-guard-choice");
          return;
        }

        setViewState("ready");
      } catch (error) {
        console.error("Failed to load Safe info:", error);
        setSafeInfo(null);
        setViewState("error");
      }
    },
    [setSafeAddress, setChainId, setSearchParams, setGuardAddress, setIsDetached],
  );

  const handleClearConfig = useCallback(() => {
    // Reset everything and go back to setup
    initializedRef.current = false;

    // Use flushSync to ensure state updates happen synchronously
    flushSync(() => {
      clearConfig();
      setSafeInfo(null);
      setViewState("setup");
    });

    // Navigate to root using React Router to ensure proper state sync
    navigate("/", { replace: true });
  }, [clearConfig, navigate]);

  // Handle choice: Deploy New Guard
  const handleDeployNew = useCallback(() => {
    setViewState("deploy-wizard");
  }, []);

  // Handle choice: Use Existing Guard (detached mode)
  const handleUseExisting = useCallback(() => {
    setViewState("detached-input");
  }, []);

  // Handle detached guard input continue
  const handleDetachedContinue = useCallback(
    (guardAddr: Address) => {
      if (!safeInfo) return;

      // Save to URL params
      setSearchParams({
        safeAddress: safeInfo.address,
        chainId: String(safeInfo.chainId),
        guardAddress: guardAddr,
      });

      // Set in context
      setGuardAddress(guardAddr);
      setIsDetached(true);
      setViewState("ready");
    },
    [safeInfo, setSearchParams, setGuardAddress, setIsDetached],
  );

  // Handle back from choice/input screens
  const handleBackToChoice = useCallback(() => {
    setViewState("no-guard-choice");
  }, []);

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

  // Handle error - couldn't connect to Safe or invalid guard
  if (viewState === "error" || !safeInfo) {
    // Check if it's an invalid guard error
    if (safeInfo?.hasGuard && !safeInfo.isValidCanonGuard) {
      return (
        <ErrorState
          title='Unsupported Guard'
          message={`This Safe has a guard attached (${safeInfo.guardAddress}), but it was not deployed from a supported Canon Guard Factory. Canon Guard UI only works with guards deployed from the official factory. Please remove the current guard before using Canon Guard.`}
          onChangeSetup={handleClearConfig}
        />
      );
    }

    return (
      <ErrorState
        title='Invalid Safe'
        message='The address provided is not a valid Safe on this network.'
        onChangeSetup={handleClearConfig}
      />
    );
  }

  // Case C: Safe has no guard - show choice screen
  if (viewState === "no-guard-choice") {
    return (
      <NoGuardChoiceScreen
        safeInfo={safeInfo}
        onDeployNew={handleDeployNew}
        onUseExisting={handleUseExisting}
        onBack={handleClearConfig}
      />
    );
  }

  // Deploy new guard wizard
  if (viewState === "deploy-wizard") {
    return (
      <GuardSetupWizard
        safeInfo={safeInfo}
        onBack={handleBackToChoice}
        onReset={handleClearConfig}
        onComplete={handleDetachedContinue}
      />
    );
  }

  // Detached guard input
  if (viewState === "detached-input") {
    return (
      <DetachedGuardInput
        safeInfo={safeInfo}
        onContinue={handleDetachedContinue}
        onBack={handleBackToChoice}
        onReset={handleClearConfig}
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
