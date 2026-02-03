import { useState } from "react";
import { Box, Typography, Button, styled, CircularProgress } from "@mui/material";
import { Address, isAddress } from "viem";
import { SupportedChainId, SUPPORTED_CHAINS_LIST, DEFAULT_CHAIN_ID } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { Header } from "./Header";
import { FormInput } from "./NewAction/shared/FormInput";
import { PageContainer, SetupContentArea, SetupFormWrapper, SetupSectionTitle } from "./shared/StyledComponents";

interface VaultSetupModalProps {
  open: boolean;
  onSubmit: (safeAddress: Address, chainId: SupportedChainId) => Promise<void>;
}

export const VaultSetupModal = ({ open, onSubmit }: VaultSetupModalProps) => {
  const [safeAddress, setSafeAddress] = useState("");
  const [chainId, setChainId] = useState<SupportedChainId>(DEFAULT_CHAIN_ID);
  const [errors, setErrors] = useState<{ safeAddress?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = (): boolean => {
    const newErrors: { safeAddress?: string } = {};

    if (!safeAddress) {
      newErrors.safeAddress = "Safe address is required";
    } else if (!isAddress(safeAddress)) {
      newErrors.safeAddress = "Invalid Ethereum address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs() || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(safeAddress as Address, chainId);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const handleReset = () => {
    setSafeAddress("");
    setChainId(DEFAULT_CHAIN_ID);
    setErrors({});
  };

  return (
    <PageContainer>
      <Header isMinimalMode onClearConfig={handleReset} />

      <SetupContentArea>
        <SetupFormWrapper data-testid='setup-form'>
          <SetupSectionTitle>Add New Safe Account</SetupSectionTitle>

          <FormCard>
            <FormSection>
              <InfoText>
                Canon Guard sits on top of a Safe Account, so before starting, ensure that you have a Safe Account
                already deployed on-chain.
              </InfoText>

              <InputsContainer>
                <FormInput
                  label='Safe Address'
                  placeholder='0x...'
                  value={safeAddress}
                  onChange={(value) => {
                    setSafeAddress(value);
                    if (errors.safeAddress) setErrors((prev) => ({ ...prev, safeAddress: undefined }));
                  }}
                  disabled={isLoading}
                  error={errors.safeAddress}
                  data-testid='safe-address-input'
                />

                <FormInput
                  label='Chain'
                  type='select'
                  value={chainId.toString()}
                  onChange={(value) => setChainId(Number(value) as SupportedChainId)}
                  selectOptions={SUPPORTED_CHAINS_LIST.map((chain) => ({
                    label: chain.name,
                    value: chain.id.toString(),
                  }))}
                  disabled={isLoading}
                  data-testid='chain-selector'
                />
              </InputsContainer>
            </FormSection>

            <ButtonSection>
              <ContinueButton onClick={handleSubmit} disabled={isLoading} data-testid='continue-button'>
                {isLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "CONTINUE"}
              </ContinueButton>
            </ButtonSection>
          </FormCard>
        </SetupFormWrapper>
      </SetupContentArea>
    </PageContainer>
  );
};

// Form card
const FormCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const FormSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "32px",
  padding: "24px",
});

const InfoText = styled(Typography)({
  fontSize: "13px",
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
});

const InputsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
});

// Button section
const ButtonSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "24px",
  borderTop: `1px dashed ${canonHeaderTokens.background.layer0}`,
});

const ContinueButton = styled(Button)({
  width: "100%",
  height: "36px",
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  borderRadius: "100px",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#129035",
  },
  "&:disabled": {
    backgroundColor: canonHeaderTokens.brand.green,
    opacity: 0.8,
    cursor: "not-allowed",
  },
});
