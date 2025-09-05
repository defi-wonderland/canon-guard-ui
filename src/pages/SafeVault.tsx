import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, styled } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { Address, isAddress } from "viem";
import { CanonGuardVault } from "~/components/CanonGuardVault";
import { ErrorState } from "~/components/ErrorState";
import { VaultSetupModal } from "~/components/VaultSetupModal";
import { useSafeService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { SafeInfo } from "~/types";

export const SafeVault = () => {
  const { vaultAddress, rpcUrl, setVaultAddress, setRpcUrl, clearVaultConfig } = useStateContext();
  const safeService = useSafeService();
  const [searchParams, setSearchParams] = useSearchParams();

  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadVaultInfo = useCallback(
    async (address: Address) => {
      try {
        setLoading(true);
        const info = await safeService.getVaultInfo(address);
        setSafeInfo(info);
      } catch (error) {
        console.error("Failed to load vault info:", error);
        setSafeInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [safeService],
  );

  useEffect(() => {
    const safeAddress = searchParams.get("safeAddress");
    const rpcUrlParam = searchParams.get("rpcUrl");

    if (safeAddress && isAddress(safeAddress) && rpcUrlParam) {
      const decodedRpcUrl = decodeURIComponent(rpcUrlParam);
      if (decodedRpcUrl.startsWith("http://") || decodedRpcUrl.startsWith("https://")) {
        setVaultAddress(safeAddress as Address);
        setRpcUrl(decodedRpcUrl);

        handleLoadVaultInfo(safeAddress as Address);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetupSubmit = async (address: Address, rpc: string) => {
    setVaultAddress(address);
    setRpcUrl(rpc);
    setSearchParams({
      safeAddress: address,
      rpcUrl: encodeURIComponent(rpc),
    });

    handleLoadVaultInfo(address);
  };

  const handleClearVaultConfig = () => {
    clearVaultConfig();
    setSearchParams({});
    setSafeInfo(null);
  };

  if (!vaultAddress || !rpcUrl) {
    return <VaultSetupModal open onSubmit={handleSetupSubmit} />;
  }

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
        <LoadingText variant='h6'>Loading Safe info...</LoadingText>
      </LoadingContainer>
    );
  }

  if (!safeInfo) {
    return (
      <ErrorState
        title='Connection Failed'
        message='Unable to load data from the provided address and RPC endpoint.'
        onChangeSetup={handleClearVaultConfig}
      />
    );
  }

  if (!safeInfo.hasCanonGuard) {
    return (
      <ErrorState
        title='Canon Guard Not Found'
        message='This Safe address does not have Canon Guard configured.'
        onChangeSetup={handleClearVaultConfig}
      />
    );
  }

  return <CanonGuardVault safeInfo={safeInfo} onClearVaultConfig={handleClearVaultConfig} />;
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
