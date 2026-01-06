import { useState, useEffect, useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import { canonGuardAbi } from "~/abis/canonGuard";
import { BoxIcon, PlusIcon, MinusIcon, CheckIcon, InfoIcon, ZapOffIcon, LockIcon, CopyIcon } from "~/components/icons";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { Breadcrumb, FormSection, ActionButton, ButtonRow } from "../shared";
import type { TransferFormData } from "./index";

// Time unit multipliers in seconds
type TimeUnit = "seconds" | "hours" | "days" | "weeks" | "months";

const TIME_UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  seconds: 1,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000, // 30 days
};

/**
 * Convert seconds to a human-readable duration string
 */
const humanizeDuration = (seconds: number): string => {
  const years = Math.floor(seconds / (365 * 24 * 3600));
  const months = Math.floor((seconds % (365 * 24 * 3600)) / (30 * 24 * 3600));
  const days = Math.floor((seconds % (30 * 24 * 3600)) / (24 * 3600));

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
  if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(", ") : "0 seconds";
};

// Tooltip content
const TOOLTIP_DEPLOY_SAVE =
  "Deploy and save for future use. Once deployed, you can propose or pre-approve it later. Deploying and saving doesn't require multisig.";
const TOOLTIP_PROPOSE_TRANSACTION =
  "Request signatures from Safe signers. This transaction will follow the slow path with a 7-day delay.";
const TOOLTIP_PROPOSE_PREAPPROVAL =
  "Request signatures from Safe signers. This transaction will follow the fast-path with a 1 hour delay.";

interface ReviewDeployStepProps {
  formData: TransferFormData;
  guardAddress: Address;
  chainId: number;
  onBack: () => void;
  onInitiate: (proposeTransaction: boolean, proposePreApproval: boolean, approvalDurationSeconds?: bigint) => void;
  onNavigateToCreate: () => void;
  onEdit: () => void;
}

export const ReviewDeployStep = ({
  formData,
  guardAddress,
  chainId,
  onBack,
  onInitiate,
  onNavigateToCreate,
  onEdit,
}: ReviewDeployStepProps) => {
  const config = useConfig();

  const [parametersExpanded, setParametersExpanded] = useState(false);
  const [proposeTransaction, setProposeTransaction] = useState(true);
  const [proposePreApproval, setProposePreApproval] = useState(false);

  // Pre-approval duration state
  const [durationAmount, setDurationAmount] = useState<string>("1");
  const [durationUnit, setDurationUnit] = useState<TimeUnit>("hours");
  const [maxApprovalDuration, setMaxApprovalDuration] = useState<bigint | null>(null);
  const [isLoadingMax, setIsLoadingMax] = useState(false);

  // Fetch MAX_APPROVAL_DURATION from Canon Guard contract
  useEffect(() => {
    const fetchMaxDuration = async () => {
      if (!guardAddress || !chainId) return;

      setIsLoadingMax(true);
      try {
        const maxDuration = await readContract(config, {
          address: guardAddress,
          abi: canonGuardAbi,
          functionName: "MAX_APPROVAL_DURATION",
          chainId: chainId,
        });
        setMaxApprovalDuration(maxDuration as bigint);
      } catch (error) {
        console.error("[ReviewDeployStep] Failed to fetch MAX_APPROVAL_DURATION:", error);
      } finally {
        setIsLoadingMax(false);
      }
    };

    fetchMaxDuration();
  }, [config, guardAddress, chainId]);

  // Calculate total duration in seconds and validate
  const { totalDurationSeconds, isValid, errorMessage } = useMemo(() => {
    const amount = parseFloat(durationAmount) || 0;
    if (amount <= 0) {
      return { totalDurationSeconds: 0n, isValid: false, errorMessage: "Duration must be greater than 0" };
    }

    const multiplier = TIME_UNIT_MULTIPLIERS[durationUnit];
    const totalSeconds = BigInt(Math.floor(amount * multiplier));

    if (maxApprovalDuration !== null && totalSeconds > maxApprovalDuration) {
      const maxHumanized = humanizeDuration(Number(maxApprovalDuration));
      return {
        totalDurationSeconds: totalSeconds,
        isValid: false,
        errorMessage: `Exceeds maximum duration of ${maxHumanized}`,
      };
    }

    return { totalDurationSeconds: totalSeconds, isValid: true, errorMessage: null };
  }, [durationAmount, durationUnit, maxApprovalDuration]);

  // Handle initiate with duration
  const handleInitiate = () => {
    if (proposePreApproval && !isValid) return;
    onInitiate(proposeTransaction, proposePreApproval, proposePreApproval ? totalDurationSeconds : undefined);
  };

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action' />

        {/* Preview Action Section */}
        <FormSection label='PREVIEW ACTION'>
          <ActionPreviewCard>
            <PreviewHeader>
              <ActionTitle>{formData.title || "Untitled Transaction"}</ActionTitle>
              <PreviewRow>
                <FactoryInfo>
                  <FactoryLabel>CANON FACTORY</FactoryLabel>
                  <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <FactoryValue>TRANSFER</FactoryValue>
                </FactoryInfo>
                <EditButton onClick={onEdit}>EDIT</EditButton>
              </PreviewRow>
            </PreviewHeader>

            {/* Parameters Expandable Section */}
            <ParametersToggle onClick={() => setParametersExpanded(!parametersExpanded)}>
              <ToggleContent>
                {parametersExpanded ? (
                  <MinusIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                ) : (
                  <PlusIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                )}
                <ToggleLabel>PARAMETERS</ToggleLabel>
              </ToggleContent>
            </ParametersToggle>

            {parametersExpanded && (
              <ParametersContent>
                <ParameterRow>
                  <ParameterLabel>Token Address</ParameterLabel>
                  <ParameterValueRow
                    $clickable={!!formData.tokenAddress}
                    onClick={() => formData.tokenAddress && navigator.clipboard.writeText(formData.tokenAddress)}
                  >
                    <ParameterValue>{formData.tokenAddress || "-"}</ParameterValue>
                    {formData.tokenAddress && (
                      <CopyIconWrapper className='copy-icon'>
                        <CopyIcon size={10} color={canonHeaderTokens.foreground.accent10} />
                      </CopyIconWrapper>
                    )}
                  </ParameterValueRow>
                </ParameterRow>
                <ParameterRow>
                  <ParameterLabel>Recipient Address</ParameterLabel>
                  <ParameterValueRow
                    $clickable={!!formData.recipientAddress}
                    onClick={() =>
                      formData.recipientAddress && navigator.clipboard.writeText(formData.recipientAddress)
                    }
                  >
                    <ParameterValue>{formData.recipientAddress || "-"}</ParameterValue>
                    {formData.recipientAddress && (
                      <CopyIconWrapper className='copy-icon'>
                        <CopyIcon size={10} color={canonHeaderTokens.foreground.accent10} />
                      </CopyIconWrapper>
                    )}
                  </ParameterValueRow>
                </ParameterRow>
                <ParameterRow $noBorder>
                  <ParameterLabel>Amount</ParameterLabel>
                  <ParameterValueRow
                    $clickable={!!formData.amount}
                    onClick={() => formData.amount && navigator.clipboard.writeText(formData.amount)}
                  >
                    <ParameterValue>{formData.amount || "-"}</ParameterValue>
                    {formData.amount && (
                      <CopyIconWrapper className='copy-icon'>
                        <CopyIcon size={10} color={canonHeaderTokens.foreground.accent10} />
                      </CopyIconWrapper>
                    )}
                  </ParameterValueRow>
                </ParameterRow>
              </ParametersContent>
            )}
          </ActionPreviewCard>
        </FormSection>

        {/* Setup Action Deploy Section */}
        <FormSection label='SETUP ACTION DEPLOY'>
          <DeployOptionsCard>
            {/* Deploy & Save Transaction - Locked */}
            <CheckboxRow>
              <CheckboxLeft>
                <LockedCheckbox>
                  <CheckIconWrapper className='check-icon'>
                    <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />
                  </CheckIconWrapper>
                  <LockIconWrapper className='lock-icon'>
                    <LockIcon size={12} color={canonHeaderTokens.background.layer0} />
                  </LockIconWrapper>
                </LockedCheckbox>
                <CheckboxLabel>Deploy & Save Transaction</CheckboxLabel>
              </CheckboxLeft>
              <StyledTooltip title={TOOLTIP_DEPLOY_SAVE} placement='top-end'>
                <InfoIconWrapper>
                  <InfoIcon size={14} color={canonHeaderTokens.foreground.accent30} />
                </InfoIconWrapper>
              </StyledTooltip>
            </CheckboxRow>

            {/* Propose Transaction */}
            <CheckboxRow>
              <CheckboxLeft>
                <Checkbox checked={proposeTransaction} onClick={() => setProposeTransaction(!proposeTransaction)}>
                  {proposeTransaction && <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />}
                </Checkbox>
                <CheckboxLabel>Propose Transaction</CheckboxLabel>
              </CheckboxLeft>
              <RightContent>
                <SlowPathTag>
                  <ZapOffIcon size={12} color={canonHeaderTokens.status.red} />
                  <SlowPathLabel>SLOW-PATH</SlowPathLabel>
                </SlowPathTag>
                <StyledTooltip title={TOOLTIP_PROPOSE_TRANSACTION} placement='top-end'>
                  <InfoIconWrapper>
                    <InfoIcon size={14} color={canonHeaderTokens.foreground.accent30} />
                  </InfoIconWrapper>
                </StyledTooltip>
              </RightContent>
            </CheckboxRow>

            {/* Propose Pre-Approval */}
            <CheckboxRow style={{ borderBottom: proposePreApproval ? "none" : "none" }}>
              <CheckboxLeft>
                <Checkbox checked={proposePreApproval} onClick={() => setProposePreApproval(!proposePreApproval)}>
                  {proposePreApproval && <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />}
                </Checkbox>
                <CheckboxLabel>Propose Pre-Approval</CheckboxLabel>
              </CheckboxLeft>
              <RightContent>
                <SlowPathTag>
                  <ZapOffIcon size={12} color={canonHeaderTokens.status.red} />
                  <SlowPathLabel>SLOW-PATH</SlowPathLabel>
                </SlowPathTag>
                <StyledTooltip title={TOOLTIP_PROPOSE_PREAPPROVAL} placement='top-end'>
                  <InfoIconWrapper>
                    <InfoIcon size={14} color={canonHeaderTokens.foreground.accent30} />
                  </InfoIconWrapper>
                </StyledTooltip>
              </RightContent>
            </CheckboxRow>

            {/* Duration Input - shown when Pre-Approval is checked */}
            {proposePreApproval && (
              <DurationInputSection>
                <DurationLabel>Duration</DurationLabel>
                <DurationInputRow>
                  <DurationInput
                    type='number'
                    min='1'
                    value={durationAmount}
                    onChange={(e) => setDurationAmount(e.target.value)}
                    placeholder='Enter duration'
                    $hasError={!isValid && durationAmount !== ""}
                  />
                  <DurationUnitSelect
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as TimeUnit)}
                  >
                    <option value='seconds'>seconds</option>
                    <option value='hours'>hours</option>
                    <option value='days'>days</option>
                    <option value='weeks'>weeks</option>
                    <option value='months'>months</option>
                  </DurationUnitSelect>
                </DurationInputRow>
                {!isValid && errorMessage && (
                  <DurationError>
                    <ErrorText>{errorMessage}</ErrorText>
                  </DurationError>
                )}
                {isLoadingMax && <DurationHint>Loading max duration...</DurationHint>}
              </DurationInputSection>
            )}

            <ButtonRow>
              <ActionButton variant='secondary' onClick={onBack}>
                BACK
              </ActionButton>
              <ActionButton variant='primary' onClick={handleInitiate} disabled={proposePreApproval && !isValid}>
                INITIATE
              </ActionButton>
            </ButtonRow>
          </DeployOptionsCard>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 120px 64px",
  width: "100%",
  boxSizing: "border-box",
});

const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
  maxWidth: "576px",
});

const ActionPreviewCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

const PreviewHeader = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "16px",
});

const ActionTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
});

const PreviewRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

const FactoryInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const FactoryLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const FactoryValue = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const EditButton = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  cursor: "pointer",
  "&:hover": {
    color: canonHeaderTokens.foreground.accent10,
  },
});

const ParametersToggle = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "36px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
  cursor: "pointer",
  "&:hover": {
    opacity: 0.9,
  },
});

const ToggleContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
});

const ToggleLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

const ParametersContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const ParameterRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$noBorder",
})<{ $noBorder?: boolean }>(({ $noBorder }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px 16px 16px 36px",
  borderTop: $noBorder ? "none" : `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
}));

const ParameterLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ParameterValueRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$clickable",
})<{ $clickable?: boolean }>(({ $clickable }) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: $clickable ? "pointer" : "default",
  "&:hover": {
    "& .copy-icon": {
      opacity: 1,
    },
  },
})) as typeof Box & { $clickable?: boolean };

const ParameterValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  fontFamily: "monospace",
  wordBreak: "break-all",
});

const CopyIconWrapper = styled("span")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.3,
  transition: "opacity 0.15s ease",
  flexShrink: 0,
});

const DeployOptionsCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

const CheckboxRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  borderBottom: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const CheckboxLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "20px",
});

const LockedCheckbox = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.brand.green,
  position: "relative",
  "&:hover": {
    "& .check-icon": {
      opacity: 0,
    },
    "& .lock-icon": {
      opacity: 1,
    },
  },
});

const CheckIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.15s ease",
});

const LockIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  opacity: 0,
  transition: "opacity 0.15s ease",
});

const Checkbox = styled(Box)<{ checked: boolean }>(({ checked }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  backgroundColor: checked ? canonHeaderTokens.brand.green : "transparent",
  border: checked ? "none" : `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    opacity: 0.9,
  },
}));

const CheckboxLabel = styled(Typography)({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const RightContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const SlowPathTag = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const SlowPathLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: canonHeaderTokens.status.red,
});

const InfoIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

// Duration input styles
const DurationInputSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px",
  paddingLeft: "64px", // Align with checkbox labels
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const DurationLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

const DurationInputRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const DurationInput = styled("input")<{ $hasError?: boolean }>(({ $hasError }) => ({
  flex: 1,
  height: "40px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `1px solid ${$hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  outline: "none",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: $hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent20,
  },
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
  // Remove number input spinners
  "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "&[type=number]": {
    MozAppearance: "textfield",
  },
}));

const DurationUnitSelect = styled("select")({
  height: "40px",
  padding: "0 32px 0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: canonHeaderTokens.foreground.accent20,
  },
  "& option": {
    backgroundColor: canonHeaderTokens.background.layer0,
    color: canonHeaderTokens.foreground.accent0,
  },
});

const DurationError = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "4px",
});

const ErrorText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
});

const DurationHint = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
  fontStyle: "italic",
});
