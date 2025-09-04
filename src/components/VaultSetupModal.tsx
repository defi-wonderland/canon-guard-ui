import { useState } from "react";
import { Modal, Box, Typography, Switch, FormControlLabel, Button, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Address, isAddress } from "viem";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { DEMO_SAFE_WITH_GUARD, OPTIMISM_MAINNET_RPC } from "~/constants/addresses";

const DEMO_DATA = {
  vaultAddress: DEMO_SAFE_WITH_GUARD,
  rpcUrl: OPTIMISM_MAINNET_RPC,
};

interface VaultSetupModalProps {
  open: boolean;
  onSubmit: (vaultAddress: Address, rpcUrl: string) => void;
}

export const VaultSetupModal = ({ open, onSubmit }: VaultSetupModalProps) => {
  const [vaultAddress, setVaultAddress] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  const handleDemoModeToggle = (checked: boolean) => {
    setDemoMode(checked);
    if (checked) {
      setVaultAddress(DEMO_DATA.vaultAddress);
      setRpcUrl(DEMO_DATA.rpcUrl);
    } else {
      setVaultAddress("");
      setRpcUrl("");
    }
  };

  const handleSubmit = () => {
    if (!vaultAddress || !rpcUrl || !isAddress(vaultAddress)) {
      return;
    }

    onSubmit(vaultAddress as Address, rpcUrl);
  };

  return (
    <StyledModal open={open} disableEscapeKeyDown keepMounted={false}>
      <SetupModalContainer>
        <SetupModalContent>
          <SetupModalHeader>
            <SetupModalTitle>Setup Canon Vault</SetupModalTitle>
            <SetupModalSubtitle>Enter your Canon Vault address and RPC endpoint to get started</SetupModalSubtitle>
          </SetupModalHeader>

          <Box display='flex' justifyContent='center'>
            <FormControlLabel
              control={<Switch checked={demoMode} onChange={(e) => handleDemoModeToggle(e.target.checked)} />}
              label='Demo Mode (Use example Canon Guard Safe)'
            />
          </Box>

          <Box display='flex' flexDirection='column' gap={3}>
            <TextField
              fullWidth
              label='Canon Vault Address'
              placeholder='0x...'
              value={vaultAddress}
              onChange={(e) => setVaultAddress(e.target.value)}
              disabled={demoMode}
              data-testid='vault-address-input'
            />

            <TextField
              fullWidth
              label='RPC URL'
              placeholder='https://...'
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              disabled={demoMode}
              data-testid='rpc-url-input'
            />
          </Box>

          <Box display='flex' justifyContent='center'>
            <Button variant='contained' onClick={handleSubmit} fullWidth data-testid='continue-to-vault-button'>
              Continue to Vault
            </Button>
          </Box>
        </SetupModalContent>
      </SetupModalContainer>
    </StyledModal>
  );
};

const StyledModal = styled(Modal)({
  zIndex: 2000,
});

const SetupModalContainer = styled(Box)(() => ({
  position: "relative",
  width: "100%",
  maxWidth: "500px",
  margin: safeDesignTokens.spacing.lg,
}));

const SetupModalContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: safeDesignTokens.spacing.md,
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.primary,
  padding: safeDesignTokens.spacing.xxl,
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  border: `1px solid ${safeDesignTokens[theme.palette.mode].borders.primary}`,
}));

const SetupModalHeader = styled(Box)(() => ({
  textAlign: "center",
  marginBottom: safeDesignTokens.spacing.xl,
}));

const SetupModalTitle = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.sectionTitle,
  color: theme.palette.text.primary,
  marginBottom: safeDesignTokens.spacing.sm,
}));

const SetupModalSubtitle = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.cardBody,
  color: theme.palette.text.secondary,
}));
