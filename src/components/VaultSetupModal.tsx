import { useState } from "react";
import { Box, Typography, Button, styled } from "@mui/material";
import { Address, isAddress } from "viem";
import { SupportedChainId, SUPPORTED_CHAINS_LIST, DEFAULT_CHAIN_ID } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { HeaderLogo } from "./Header";

interface VaultSetupModalProps {
  open: boolean;
  onSubmit: (safeAddress: Address, chainId: SupportedChainId) => void;
}

export const VaultSetupModal = ({ open, onSubmit }: VaultSetupModalProps) => {
  const [safeAddress, setSafeAddress] = useState("");
  const [chainId, setChainId] = useState<SupportedChainId>(DEFAULT_CHAIN_ID);
  const [errors, setErrors] = useState<{ safeAddress?: string }>({});

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

  const handleSubmit = () => {
    if (!validateInputs()) {
      return;
    }

    onSubmit(safeAddress as Address, chainId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <PageContainer>
      <Header>
        <HeaderLogo />
      </Header>

      <ContentArea>
        <FormWrapper>
          <SectionTitle>ADD NEW SAFE ACCOUNT</SectionTitle>

          <FormCard>
            <FormSection>
              <InfoText>
                Before starting, ensure that you have a Safe Address setup and that your Canon Guard is activated. You
                can{" "}
                <InfoLink
                  href='https://github.com/gizatechxyz/canon-guard#setup'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  set up your Canon Guard
                </InfoLink>{" "}
                using this script.
              </InfoText>

              <InputsContainer>
                <InputGroup>
                  <InputLabel>Safe Address</InputLabel>
                  <StyledInput
                    type='text'
                    placeholder='0x...'
                    value={safeAddress}
                    onChange={(e) => {
                      setSafeAddress(e.target.value);
                      if (errors.safeAddress) setErrors((prev) => ({ ...prev, safeAddress: undefined }));
                    }}
                    onKeyDown={handleKeyDown}
                    $hasError={!!errors.safeAddress}
                    data-testid='safe-address-input'
                  />
                  {errors.safeAddress && <ErrorText>{errors.safeAddress}</ErrorText>}
                </InputGroup>

                <InputGroup>
                  <InputLabel>Chain</InputLabel>
                  <StyledSelect
                    value={chainId}
                    onChange={(e) => setChainId(Number(e.target.value) as SupportedChainId)}
                    data-testid='chain-select'
                  >
                    {SUPPORTED_CHAINS_LIST.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </StyledSelect>
                </InputGroup>
              </InputsContainer>
            </FormSection>

            <ButtonSection>
              <ContinueButton onClick={handleSubmit} data-testid='continue-button'>
                CONTINUE
              </ContinueButton>
            </ButtonSection>
          </FormCard>
        </FormWrapper>
      </ContentArea>
    </PageContainer>
  );
};

// Page layout
const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const Header = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "72px",
  backgroundColor: canonHeaderTokens.background.layer1,
  width: "100%",
});

const ContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 120px 64px",
});

const FormWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  maxWidth: "576px",
});

const SectionTitle = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent30,
  padding: "8px",
});

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

const InfoLink = styled("a")({
  color: canonHeaderTokens.foreground.accent10,
  textDecoration: "underline",
  "&:hover": {
    color: canonHeaderTokens.foreground.accent0,
  },
});

const InputsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
});

const InputGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const InputLabel = styled("label")({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const StyledInput = styled("input")<{ $hasError?: boolean }>(({ $hasError }) => ({
  width: "100%",
  padding: "16px 20px",
  fontSize: "16px",
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: "transparent",
  border: `1px solid ${$hasError ? "#ef4444" : "#37373e"}`,
  borderRadius: "8px",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
  "&:focus": {
    borderColor: $hasError ? "#ef4444" : canonHeaderTokens.brand.green,
  },
}));

const StyledSelect = styled("select")({
  width: "100%",
  padding: "16px 20px",
  fontSize: "16px",
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: "transparent",
  border: "1px solid #37373e",
  borderRadius: "8px",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23b5b5b7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 20px center",
  paddingRight: "48px",
  "&:focus": {
    borderColor: canonHeaderTokens.brand.green,
  },
  "& option": {
    backgroundColor: canonHeaderTokens.background.layer1,
    color: canonHeaderTokens.foreground.accent0,
  },
});

const ErrorText = styled(Typography)({
  fontSize: "12px",
  color: "#ef4444",
  marginTop: "-8px",
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
});
