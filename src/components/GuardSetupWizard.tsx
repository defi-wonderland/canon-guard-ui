import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { Address, isAddress } from "viem";
import { getRpcUrlForChain, getViemChain } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { CANON_GUARD_FACTORY, MULTI_SEND_CALL_ONLY } from "~/constants/addresses";
import { ClientService, CanonGuardValidationService } from "~/services";
import { SafeInfo } from "~/types";
import { DurationTimeUnit, DURATION_TIME_MULTIPLIERS } from "~/utils/timeUnits";
import { HeaderLogo } from "./Header";
import { CheckIcon, InfoIcon } from "./icons";
import { CopyableText } from "./shared/CopyButton";
import { DurationInput } from "./shared/DurationInput";
import { SafeProfileCard } from "./shared/SafeProfileCard";
import {
  PageContainer,
  SetupHeader,
  SetupContentArea,
  SetupFormWrapper,
  SetupSectionTitle,
} from "./shared/StyledComponents";

interface GuardSetupWizardProps {
  safeInfo: SafeInfo;
  onBack: () => void;
  onReset: () => void;
  onComplete: (guardAddress: Address) => void;
}

interface DurationValue {
  amount: string;
  unit: DurationTimeUnit;
}

interface SetupParams {
  shortTxExecutionDelay: DurationValue;
  longTxExecutionDelay: DurationValue;
  txExpiryDelay: DurationValue;
  maxApprovalDuration: DurationValue;
  emergencyTrigger: string;
  emergencyCaller: string;
}

const DEFAULT_VALUES: SetupParams = {
  shortTxExecutionDelay: { amount: "1", unit: "hours" }, // 1 hour
  longTxExecutionDelay: { amount: "7", unit: "days" }, // 7 days
  txExpiryDelay: { amount: "7", unit: "days" }, // 7 days
  maxApprovalDuration: { amount: "4", unit: "months" }, // ~4 months (adjust as needed)
  emergencyTrigger: "",
  emergencyCaller: "",
};

// Duration fields that use DurationInput
const DURATION_FIELDS: (keyof Pick<
  SetupParams,
  "shortTxExecutionDelay" | "longTxExecutionDelay" | "txExpiryDelay" | "maxApprovalDuration"
>)[] = ["shortTxExecutionDelay", "longTxExecutionDelay", "txExpiryDelay", "maxApprovalDuration"];

const PARAM_INFO = {
  shortTxExecutionDelay: {
    label: "Short Execution Delay",
    description: "Time delay for pre-approved transactions",
  },
  longTxExecutionDelay: {
    label: "Long Execution Delay",
    description: "Time delay for non-pre-approved transactions",
  },
  txExpiryDelay: {
    label: "Transaction Expiry",
    description: "How long a transaction remains executable",
  },
  maxApprovalDuration: {
    label: "Max Approval Duration",
    description: "Maximum time an action can be pre-approved",
  },
  emergencyTrigger: {
    label: "Emergency Trigger",
    description: "Address that can activate emergency mode",
    placeholder: "0x...",
  },
  emergencyCaller: {
    label: "Emergency Caller",
    description: "Address that can execute during emergency mode",
    placeholder: "0x...",
  },
};

// Helper to convert duration to seconds
const toSeconds = (duration: DurationValue): number => {
  const amount = parseFloat(duration.amount) || 0;
  return Math.floor(amount * DURATION_TIME_MULTIPLIERS[duration.unit]);
};

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export const GuardSetupWizard = ({ safeInfo, onBack, onReset, onComplete }: GuardSetupWizardProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [params, setParams] = useState<SetupParams>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Partial<SetupParams>>({});

  // Guard address input for step 2
  const [deployedGuardAddress, setDeployedGuardAddress] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Computed seconds values for display and validation
  const secondsValues = useMemo(
    () => ({
      shortTxExecutionDelay: toSeconds(params.shortTxExecutionDelay).toString(),
      longTxExecutionDelay: toSeconds(params.longTxExecutionDelay).toString(),
      txExpiryDelay: toSeconds(params.txExpiryDelay).toString(),
      maxApprovalDuration: toSeconds(params.maxApprovalDuration).toString(),
    }),
    [params.shortTxExecutionDelay, params.longTxExecutionDelay, params.txExpiryDelay, params.maxApprovalDuration],
  );

  const validateParams = (): boolean => {
    const newErrors: Partial<Record<keyof SetupParams, string>> = {};

    // Validate duration fields
    for (const field of DURATION_FIELDS) {
      const duration = params[field];
      const amount = parseFloat(duration.amount);
      if (!duration.amount || isNaN(amount) || amount <= 0) {
        newErrors[field] = "Must be a positive number";
      }
    }

    // Check short delay is not greater than long delay
    if (toSeconds(params.shortTxExecutionDelay) > toSeconds(params.longTxExecutionDelay)) {
      newErrors.shortTxExecutionDelay = "Cannot be greater than long delay";
    }

    if (!params.emergencyTrigger || !isAddress(params.emergencyTrigger)) {
      newErrors.emergencyTrigger = "Must be a valid address";
    }
    if (!params.emergencyCaller || !isAddress(params.emergencyCaller)) {
      newErrors.emergencyCaller = "Must be a valid address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateParams()) {
      return;
    }
    setActiveStep(1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBack();
    } else {
      setActiveStep(0);
    }
  };

  const handleAddressChange = (field: "emergencyTrigger" | "emergencyCaller", value: string) => {
    setParams((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDurationChange = (
    field: keyof Pick<
      SetupParams,
      "shortTxExecutionDelay" | "longTxExecutionDelay" | "txExpiryDelay" | "maxApprovalDuration"
    >,
    amount: string,
    unit?: DurationTimeUnit,
  ) => {
    setParams((prev) => ({
      ...prev,
      [field]: {
        amount,
        unit: unit ?? prev[field].unit,
      },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate deployed guard address
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateGuardAddress(deployedGuardAddress);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [deployedGuardAddress, validateGuardAddress]);

  const handleContinue = () => {
    if (validationState === "valid" && isAddress(deployedGuardAddress)) {
      onComplete(deployedGuardAddress as Address);
    }
  };

  const isValidGuard = validationState === "valid";
  const showError = validationState === "invalid" && validationError;

  return (
    <PageContainer>
      <SetupHeader>
        <HeaderLogo onClick={onReset} />
      </SetupHeader>

      <ScrollArea>
        <SetupContentArea>
          <SetupFormWrapper>
            <SetupSectionTitle>Setup Canon Guard</SetupSectionTitle>

            {/* Safe Profile Card */}
            <SafeProfileCard address={safeInfo.address} chainId={safeInfo.chainId} />

            {/* Step Indicator */}
            <StepIndicator>
              <StepItem
                $active={activeStep === 0}
                $completed={activeStep > 0}
                onClick={() => activeStep > 0 && setActiveStep(0)}
              >
                <StepNumber $active={activeStep === 0} $completed={activeStep > 0}>
                  1
                </StepNumber>
                <StepLabel $active={activeStep === 0}>Configure</StepLabel>
              </StepItem>
              <StepDivider />
              <StepItem $active={activeStep === 1} $completed={false}>
                <StepNumber $active={activeStep === 1} $completed={false}>
                  2
                </StepNumber>
                <StepLabel $active={activeStep === 1}>Deploy</StepLabel>
              </StepItem>
            </StepIndicator>

            {/* Step Content */}
            {activeStep === 0 ? (
              <ConfigCard>
                <InfoSection>
                  <InfoIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <InfoText>Configure the parameters for your new Canon Guard deployment.</InfoText>
                </InfoSection>

                <ParamsSection>
                  {/* Duration Fields */}
                  {DURATION_FIELDS.map((field) => (
                    <InputGroup key={field}>
                      <InputLabelRow>
                        <InputLabel>{PARAM_INFO[field].label}</InputLabel>
                        <InputHint>{PARAM_INFO[field].description}</InputHint>
                      </InputLabelRow>
                      <DurationInput
                        value={params[field].amount}
                        unit={params[field].unit}
                        onValueChange={(amount) => handleDurationChange(field, amount)}
                        onUnitChange={(unit) => handleDurationChange(field, params[field].amount, unit)}
                        hasError={!!errors[field]}
                        placeholder='Enter duration'
                      />
                      {errors[field] && <ErrorText>{errors[field]}</ErrorText>}
                    </InputGroup>
                  ))}

                  {/* Address Fields */}
                  <InputGroup>
                    <InputLabelRow>
                      <InputLabel>{PARAM_INFO.emergencyTrigger.label}</InputLabel>
                      <InputHint>{PARAM_INFO.emergencyTrigger.description}</InputHint>
                    </InputLabelRow>
                    <InputWrapper $hasError={!!errors.emergencyTrigger}>
                      <StyledInput
                        type='text'
                        placeholder={PARAM_INFO.emergencyTrigger.placeholder}
                        value={params.emergencyTrigger}
                        onChange={(e) => handleAddressChange("emergencyTrigger", e.target.value)}
                      />
                    </InputWrapper>
                    {errors.emergencyTrigger && <ErrorText>{errors.emergencyTrigger}</ErrorText>}
                  </InputGroup>

                  <InputGroup>
                    <InputLabelRow>
                      <InputLabel>{PARAM_INFO.emergencyCaller.label}</InputLabel>
                      <InputHint>{PARAM_INFO.emergencyCaller.description}</InputHint>
                    </InputLabelRow>
                    <InputWrapper $hasError={!!errors.emergencyCaller}>
                      <StyledInput
                        type='text'
                        placeholder={PARAM_INFO.emergencyCaller.placeholder}
                        value={params.emergencyCaller}
                        onChange={(e) => handleAddressChange("emergencyCaller", e.target.value)}
                      />
                    </InputWrapper>
                    {errors.emergencyCaller && <ErrorText>{errors.emergencyCaller}</ErrorText>}
                  </InputGroup>
                </ParamsSection>

                <ButtonSection>
                  <BackButton onClick={handleBack}>Back</BackButton>
                  <ContinueButton onClick={handleNext}>Continue</ContinueButton>
                </ButtonSection>
              </ConfigCard>
            ) : (
              <DeployCard>
                <InfoSection>
                  <Box sx={{ flexShrink: 0, display: "flex" }}>
                    <InfoIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  </Box>
                  <InfoText>
                    Use your Safe's Transaction Builder to deploy your Canon Guard. Please go to it and use the
                    parameters below as input.
                  </InfoText>
                </InfoSection>

                <DeploySection>
                  <DeploySectionTitle>Deployment Parameters</DeploySectionTitle>

                  <ParamRow>
                    <ParamLabel>Target Contract</ParamLabel>
                    <CopyableText
                      text={CANON_GUARD_FACTORY}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{CANON_GUARD_FACTORY}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>Contract Method Selector</ParamLabel>
                    <ParamCode>createCanonGuard</ParamCode>
                  </ParamRow>

                  <ParamsDivider />

                  <DeploySectionTitle>Function Arguments</DeploySectionTitle>

                  <ParamRow>
                    <ParamLabel>_safe</ParamLabel>
                    <CopyableText
                      text={safeInfo.address}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{safeInfo.address}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_multiSendCallOnly</ParamLabel>
                    <CopyableText
                      text={MULTI_SEND_CALL_ONLY}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{MULTI_SEND_CALL_ONLY}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_shortTxExecutionDelay</ParamLabel>
                    <CopyableText
                      text={secondsValues.shortTxExecutionDelay}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{secondsValues.shortTxExecutionDelay}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_longTxExecutionDelay</ParamLabel>
                    <CopyableText
                      text={secondsValues.longTxExecutionDelay}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{secondsValues.longTxExecutionDelay}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_txExpiryDelay</ParamLabel>
                    <CopyableText
                      text={secondsValues.txExpiryDelay}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{secondsValues.txExpiryDelay}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_maxApprovalDuration</ParamLabel>
                    <CopyableText
                      text={secondsValues.maxApprovalDuration}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{secondsValues.maxApprovalDuration}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_emergencyTrigger</ParamLabel>
                    <CopyableText
                      text={params.emergencyTrigger}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{params.emergencyTrigger}</ParamCode>
                    </CopyableText>
                  </ParamRow>

                  <ParamRow>
                    <ParamLabel>_emergencyCaller</ParamLabel>
                    <CopyableText
                      text={params.emergencyCaller}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent30}
                    >
                      <ParamCode>{params.emergencyCaller}</ParamCode>
                    </CopyableText>
                  </ParamRow>
                </DeploySection>

                <InputSection>
                  <InfoSection>
                    <Box sx={{ flexShrink: 0, display: "flex" }}>
                      <InfoIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                    </Box>
                    <InfoText>
                      After deploying, open your transaction in a block explorer. Navigate to the Logs tab and find the
                      CanonGuardCreated event — your new Canon Guard address is in Topic 1 (_canonGuard).
                    </InfoText>
                  </InfoSection>
                  <InputGroup>
                    <InputLabel>Deployed Canon Guard Address</InputLabel>
                    <InputWrapper $hasError={!!showError} $isValid={isValidGuard}>
                      <StyledInput
                        type='text'
                        placeholder='0x...'
                        value={deployedGuardAddress}
                        onChange={(e) => setDeployedGuardAddress(e.target.value)}
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
                  <BackButton onClick={handleBack}>Back</BackButton>
                  <ContinueButton onClick={handleContinue} disabled={!isValidGuard}>
                    Continue
                  </ContinueButton>
                </ButtonSection>
              </DeployCard>
            )}
          </SetupFormWrapper>
        </SetupContentArea>
      </ScrollArea>
    </PageContainer>
  );
};

// Styled Components
const ScrollArea = styled(Box)({
  flex: 1,
  overflowY: "auto",
});

// Step Indicator
const StepIndicator = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 0",
});

const StepItem = styled(Box)<{ $active: boolean; $completed: boolean }>(({ $active, $completed }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: $completed ? "pointer" : "default",
  opacity: $active || $completed ? 1 : 0.5,
}));

const StepNumber = styled(Box)<{ $active: boolean; $completed: boolean }>(({ $active, $completed }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: $active
    ? canonHeaderTokens.brand.green
    : $completed
      ? canonHeaderTokens.brand.green
      : canonHeaderTokens.background.layer1,
  color: $active || $completed ? "#ffffff" : canonHeaderTokens.foreground.accent20,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
}));

const StepLabel = styled("span")<{ $active: boolean }>(({ $active }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: $active ? 600 : 400,
  color: $active ? canonHeaderTokens.foreground.accent0 : canonHeaderTokens.foreground.accent20,
}));

const StepDivider = styled(Box)({
  flex: 1,
  height: "1px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

// Cards
const ConfigCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const DeployCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const InfoSection = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  borderRadius: "6px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
});

const InfoText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "18px",
  color: canonHeaderTokens.foreground.accent10,
  margin: 0,
});

const ParamsSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

const InputGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const InputLabelRow = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
});

const InputLabel = styled("label")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  color: canonHeaderTokens.foreground.accent10,
});

const InputHint = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent30,
});

const InputWrapper = styled(Box)<{ $hasError?: boolean; $isValid?: boolean }>(({ $hasError, $isValid }) => ({
  display: "flex",
  alignItems: "center",
  height: "40px",
  padding: "0 12px",
  borderRadius: "6px",
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `1px solid ${$hasError ? "#DA2828" : $isValid ? "#149b3a" : canonHeaderTokens.foreground.accent50}`,
  "&:focus-within": {
    borderColor: $hasError ? "#DA2828" : $isValid ? "#149b3a" : canonHeaderTokens.brand.green,
  },
}));

const StyledInput = styled("input")({
  flex: 1,
  height: "100%",
  backgroundColor: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent0,
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
});

const ValidationIcon = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: "8px",
});

const ErrorText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 400,
  color: "#DA2828",
});

const InputSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "12px",
  paddingTop: "20px",
  borderTop: `1px solid ${canonHeaderTokens.foreground.accent50}`,
});

// Deploy Section
const DeploySection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const DeploySectionTitle = styled("h3")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent30,
  margin: "8px 0 4px 0",
});

const ParamRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 0",
});

const ParamLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
});

const ParamCode = styled("code")({
  fontFamily: "monospace",
  fontSize: "12px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent0,
});

const ParamsDivider = styled(Box)({
  height: "1px",
  backgroundColor: canonHeaderTokens.foreground.accent50,
  margin: "8px 0",
});

// Buttons
const ButtonSection = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  paddingTop: "12px",
});

const BackButton = styled("button")({
  height: "36px",
  padding: "0 20px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  backgroundColor: "transparent",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.foreground.accent40}20`,
  },
});

const ContinueButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  height: "36px",
  padding: "0 24px",
  borderRadius: "100px",
  border: "none",
  backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : canonHeaderTokens.brand.green,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#ffffff",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  "&:hover": {
    backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : "#129035",
  },
}));
