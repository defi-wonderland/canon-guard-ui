import { useState } from "react";
import { Modal, Box, Typography, Switch, FormControlLabel, Button, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Address, isAddress } from "viem";
import { safeDesignTokens } from "~/config/themes/safeTheme";

const TEST_MODE_DATA = {
  vaultAddress: "0x1234567890123456789012345678901234567890",
  rpcUrl: "https://mainnet.infura.io/v3/test-project-id",
};

interface VaultSetupModalProps {
  open: boolean;
  onSubmit: (vaultAddress: Address, rpcUrl: string) => void;
}

export const VaultSetupModal = ({ open, onSubmit }: VaultSetupModalProps) => {
  const [vaultAddress, setVaultAddress] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [testMode, setTestMode] = useState(false);

  const handleTestModeToggle = (checked: boolean) => {
    setTestMode(checked);
    if (checked) {
      // Fill with hardcoded test data
      setVaultAddress(TEST_MODE_DATA.vaultAddress);
      setRpcUrl(TEST_MODE_DATA.rpcUrl);
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
    <Modal open={open} disableEscapeKeyDown keepMounted={false} sx={{ zIndex: 2000 }}>
      <SetupModalContainer>
        <SetupModalContent>
          <SetupModalHeader>
            <SetupModalTitle>Setup Canon Vault</SetupModalTitle>
            <SetupModalSubtitle>Enter your Canon Vault address and RPC endpoint to get started</SetupModalSubtitle>
          </SetupModalHeader>

          <Box display='flex' justifyContent='center'>
            <FormControlLabel
              control={<Switch checked={testMode} onChange={(e) => handleTestModeToggle(e.target.checked)} />}
              label='Test Mode'
            />
          </Box>

          <Box display='flex' flexDirection='column' gap={3}>
            <TextField
              fullWidth
              label='Canon Vault Address'
              placeholder='0x...'
              value={vaultAddress}
              onChange={(e) => setVaultAddress(e.target.value)}
              disabled={testMode}
            />

            <TextField
              fullWidth
              label='RPC URL'
              placeholder='https://...'
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              disabled={testMode}
            />
          </Box>

          <Box display='flex' justifyContent='center'>
            <Button variant='contained' onClick={handleSubmit} fullWidth>
              Continue to Vault
            </Button>
          </Box>
        </SetupModalContent>
      </SetupModalContainer>
    </Modal>
  );
};

// Styled Components
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
