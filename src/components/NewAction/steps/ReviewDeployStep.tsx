import { useState, useEffect, useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import { canonGuardAbi } from "~/abis/canonGuard";
import { BoxIcon, PlusIcon, MinusIcon, CheckIcon, InfoIcon, ZapOffIcon, LockIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { DurationInput } from "~/components/shared/DurationInput";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { humanizeDuration } from "~/hooks/useCanonGuardConfig";
import { DURATION_TIME_MULTIPLIERS, type DurationTimeUnit } from "~/utils/timeUnits";
import { Breadcrumb, FormSection, ActionButton, ButtonRow } from "../shared";
import type { TransferFormData, ArbitraryActionFormData } from "./index";

// Type guard to detect transfer form data
const isTransferFormData = (data: TransferFormData | ArbitraryActionFormData): data is TransferFormData => {
  return "transfers" in data;
};

// Tooltip content
const TOOLTIP_DEPLOY_SAVE =
  "Deploy and save for future use. Once deployed, you can propose or pre-approve it later. Deploying and saving doesn't require multisig.";
const TOOLTIP_PROPOSE_TRANSACTION =
  "Request signatures from Safe signers. This transaction will follow the slow path with a 7-day delay.";
const TOOLTIP_PROPOSE_PREAPPROVAL =
  "Request signatures from Safe signers. This transaction will follow the fast-path with a 1 hour delay.";

interface ReviewDeployStepProps {
  formData: TransferFormData | ArbitraryActionFormData;
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
  const [durationUnit, setDurationUnit] = useState<DurationTimeUnit>("hours");
  const [maxApprovalDuration, setMaxApprovalDuration] = useState<bigint | null>(null);

  // Fetch MAX_APPROVAL_DURATION from Canon Guard contract
  useEffect(() => {
    const fetchMaxDuration = async () => {
      if (!guardAddress || !chainId) return;

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

    const multiplier = DURATION_TIME_MULTIPLIERS[durationUnit];
    const totalSeconds = BigInt(Math.floor(amount * multiplier));

    if (maxApprovalDuration !== null && totalSeconds > maxApprovalDuration) {
      const maxHumanized = humanizeDuration(maxApprovalDuration);
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
                  <FactoryValue>{isTransferFormData(formData) ? "TRANSFER" : "ARBITRARY ACTION"}</FactoryValue>
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
                {isTransferFormData(formData)
                  ? // Render Transfer parameters
                    formData.transfers.map((transfer, index) => {
                      const prefix = formData.transfers.length > 1 ? `Token ${index + 1} - ` : "";
                      const isLast = index === formData.transfers.length - 1;
                      return (
                        <ItemGroup key={transfer.id}>
                          <ParameterRow>
                            <ParameterLabel>{prefix}Token Address</ParameterLabel>
                            {transfer.tokenAddress ? (
                              <CopyableText
                                text={transfer.tokenAddress}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{transfer.tokenAddress}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                          <ParameterRow>
                            <ParameterLabel>{prefix}Recipient Address</ParameterLabel>
                            {transfer.recipientAddress ? (
                              <CopyableText
                                text={transfer.recipientAddress}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{transfer.recipientAddress}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                          <ParameterRow $noBorder={isLast}>
                            <ParameterLabel>{prefix}Amount</ParameterLabel>
                            {transfer.amount ? (
                              <CopyableText
                                text={transfer.amount}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{transfer.amount}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                        </ItemGroup>
                      );
                    })
                  : // Render Simple Action parameters
                    formData.actions.map((action, index) => {
                      const prefix = formData.actions.length > 1 ? `Action ${index + 1} - ` : "";
                      const isLast = index === formData.actions.length - 1;
                      return (
                        <ItemGroup key={action.id}>
                          <ParameterRow>
                            <ParameterLabel>{prefix}Target Address</ParameterLabel>
                            {action.target ? (
                              <CopyableText
                                text={action.target}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{action.target}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                          <ParameterRow>
                            <ParameterLabel>{prefix}Function Signature</ParameterLabel>
                            {action.signature ? (
                              <CopyableText
                                text={action.signature}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{action.signature}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                          <ParameterRow>
                            <ParameterLabel>{prefix}Encoded Parameters</ParameterLabel>
                            {action.data ? (
                              <CopyableText
                                text={action.data}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{action.data}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                          <ParameterRow $noBorder={isLast}>
                            <ParameterLabel>{prefix}Value (wei)</ParameterLabel>
                            {action.value ? (
                              <CopyableText
                                text={action.value}
                                iconSize={10}
                                iconColor={canonHeaderTokens.foreground.accent10}
                              >
                                <ParameterValue>{action.value}</ParameterValue>
                              </CopyableText>
                            ) : (
                              <ParameterValue>-</ParameterValue>
                            )}
                          </ParameterRow>
                        </ItemGroup>
                      );
                    })}
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
                <DurationInput
                  value={durationAmount}
                  unit={durationUnit}
                  onValueChange={setDurationAmount}
                  onUnitChange={setDurationUnit}
                  hasError={!isValid && durationAmount !== ""}
                  placeholder='Enter duration'
                />
                {!isValid && errorMessage && (
                  <DurationError>
                    <ErrorText>{errorMessage}</ErrorText>
                  </DurationError>
                )}
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

const ItemGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
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

const ParameterValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  fontFamily: "monospace",
  wordBreak: "break-all",
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
