import { useState, useEffect, useCallback } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { Address, isAddress } from "viem";
import { getRpcUrlForChain, getViemChain } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ClientService, CanonGuardValidationService } from "~/services";
import { SafeInfo } from "~/types";
import { Header } from "./Header";
import { CheckIcon } from "./icons";
import { SafeProfileCard } from "./shared/SafeProfileCard";
import { PageContainer, SetupContentArea, SetupFormWrapper, SetupSectionTitle } from "./shared/StyledComponents";

interface DetachedGuardInputProps {
  safeInfo: SafeInfo;
  onContinue: (guardAddress: Address) => void;
  onBack: () => void;
  onReset: () => void;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export const DetachedGuardInput = ({ safeInfo, onContinue, onBack, onReset }: DetachedGuardInputProps) => {
  const [guardAddress, setGuardAddress] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Debounced validation
  const validateGuardAddress = useCallback(
    async (address: string) => {
      if (!address || !isAddress(address)) {
        setValidationState("idle");
        setValidationError(null);
        return;
      }

      setValidationState("validating");
      setValidationError(null);

      try {
        const rpcUrl = getRpcUrlForChain(safeInfo.chainId);
        const chain = getViemChain(safeInfo.chainId);
        const clientService = new ClientService(rpcUrl, chain);
        const validationService = new CanonGuardValidationService(clientService.getClient());

        const result = await validationService.validateCanonGuard(address as Address);

        if (result.isValid) {
          setValidationState("valid");
          setValidationError(null);
        } else {
          setValidationState("invalid");
          setValidationError(result.error || "Invalid Canon Guard address");
        }
      } catch {
        setValidationState("invalid");
        setValidationError("Failed to validate address");
      }
    },
    [safeInfo.chainId],
  );

  // Debounce the validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateGuardAddress(guardAddress);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [guardAddress, validateGuardAddress]);

  const handleContinue = () => {
    if (validationState === "valid" && isAddress(guardAddress)) {
      onContinue(guardAddress as Address);
    }
  };

  const isValidInput = validationState === "valid";
  const showError = validationState === "invalid" && validationError;

  return (
    <PageContainer>
      <Header isMinimalMode onClearConfig={onReset} />

      <SetupContentArea>
        <SetupFormWrapper>
          <SetupSectionTitle>Add New Safe Account</SetupSectionTitle>

          {/* Safe Profile Card */}
          <SafeProfileCard address={safeInfo.address} chainId={safeInfo.chainId} />

          {/* Input Card */}
          <InputCard>
            <InfoSection>
              <InfoText>
                It looks like your Safe doesn't have a Canon Guard attached. Enter an existing Canon Guard address to
                continue.
              </InfoText>
            </InfoSection>

            <InputSection>
              <InputGroup>
                <InputLabel data-testid='guard-address-label'>Canon Guard Address</InputLabel>
                <InputWrapper $hasError={!!showError} $isValid={isValidInput}>
                  <StyledInput
                    type='text'
                    placeholder='0x...'
                    value={guardAddress}
                    onChange={(e) => setGuardAddress(e.target.value)}
                    data-testid='guard-address-input'
                  />
                  {validationState === "validating" && (
                    <ValidationIcon>
                      <CircularProgress size={14} sx={{ color: canonHeaderTokens.foreground.accent20 }} />
                    </ValidationIcon>
                  )}
                  {validationState === "valid" && (
                    <ValidationIcon>
                      <CheckIcon size={14} color='#149b3a' />
                    </ValidationIcon>
                  )}
                </InputWrapper>
                {showError && <ErrorText>{validationError}</ErrorText>}
              </InputGroup>
            </InputSection>

            <ButtonSection>
              <BackButton onClick={onBack} data-testid='guard-back-button'>
                BACK
              </BackButton>
              <ContinueButton onClick={handleContinue} disabled={!isValidInput} data-testid='guard-continue-button'>
                CONTINUE
              </ContinueButton>
            </ButtonSection>
          </InputCard>
        </SetupFormWrapper>
      </SetupContentArea>
    </PageContainer>
  );
};

// Input Card
const InputCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const InfoSection = styled(Box)({
  padding: "24px",
});

const InfoText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
  margin: 0,
});

const InputSection = styled(Box)({
  padding: "24px",
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const InputGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const InputLabel = styled("label")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const InputWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$hasError" && prop !== "$isValid",
})<{ $hasError?: boolean; $isValid?: boolean }>(({ $hasError, $isValid }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  borderRadius: "8px",
  border: `1px solid ${$hasError ? "#ef4444" : $isValid ? "#149b3a" : canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
}));

const StyledInput = styled("input")({
  flex: 1,
  fontSize: "16px",
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: "transparent",
  border: "none",
  outline: "none",
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
});

const ValidationIcon = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: "12px",
});

const ErrorText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: "#ef4444",
  margin: 0,
});

const ButtonSection = styled(Box)({
  display: "flex",
  gap: "16px",
  padding: "24px",
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const BackButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
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
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.foreground.accent40}20`,
  },
});

const ContinueButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: "none",
  backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : canonHeaderTokens.brand.green,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: disabled ? canonHeaderTokens.foreground.accent20 : "#ffffff",
  "&:hover": {
    backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : "#129035",
  },
}));
