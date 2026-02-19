import { useState } from "react";
import { Box, styled } from "@mui/material";
import { Address } from "viem";
import {
  PreviewCard,
  PreviewHeader,
  PreviewTitle,
  PreviewRow,
  PreviewInfo,
  PreviewLabel,
  PreviewValue,
  EditButton,
  ParametersToggle,
  ToggleContent,
  ToggleLabel,
  ParametersContent,
  ParameterRow,
  ParameterLabel,
  ParameterValue,
  DeployOptionsCard,
  CheckboxRow,
  CheckboxLeft,
  LockedCheckbox,
  CheckIconWrapper,
  LockIconWrapper,
  Checkbox,
  CheckboxLabel,
  RightContent,
  SlowPathTag,
  SlowPathLabel,
  InfoIconWrapper,
  DurationInputSection,
  DurationLabel,
  DurationError,
  ErrorText,
} from "~/components/NewAction/shared/SharedStyledComponents";
import { BoxIcon, PlusIcon, MinusIcon, CheckIcon, InfoIcon, ZapOffIcon, LockIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { DurationInput } from "~/components/shared/DurationInput";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { usePreApprovalDuration } from "~/hooks";
import {
  Breadcrumb,
  FormSection,
  ActionButton,
  ButtonRow,
  StepContentWrapper as ContentWrapper,
  StepPageContainer as Container,
} from "../shared";
import type { TransferFormData, ArbitraryActionFormData } from "./index";

const isTransferFormData = (data: TransferFormData | ArbitraryActionFormData): data is TransferFormData => {
  return "transfers" in data;
};

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
  const [parametersExpanded, setParametersExpanded] = useState(false);
  const [proposeTransaction, setProposeTransaction] = useState(true);
  const [proposePreApproval, setProposePreApproval] = useState(false);

  const {
    durationAmount,
    setDurationAmount,
    durationUnit,
    setDurationUnit,
    totalDurationSeconds,
    isValid,
    errorMessage,
  } = usePreApprovalDuration(guardAddress, chainId);

  const handleInitiate = () => {
    if (proposePreApproval && !isValid) return;
    onInitiate(proposeTransaction, proposePreApproval, proposePreApproval ? totalDurationSeconds : undefined);
  };

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action' />

        <FormSection label='PREVIEW ACTION' data-testid='preview-action-title'>
          <PreviewCard>
            <PreviewHeader>
              <PreviewTitle>{formData.title || "Untitled Transaction"}</PreviewTitle>
              <PreviewRow>
                <PreviewInfo>
                  <PreviewLabel>CANON FACTORY</PreviewLabel>
                  <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <PreviewValue>{isTransferFormData(formData) ? "TRANSFER" : "ARBITRARY ACTION"}</PreviewValue>
                </PreviewInfo>
                <EditButton onClick={onEdit}>EDIT</EditButton>
              </PreviewRow>
            </PreviewHeader>

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
                  ? formData.transfers.map((transfer, index) => {
                      const prefix = formData.transfers.length > 1 ? `Token ${index + 1} - ` : "";
                      const isLast = index === formData.transfers.length - 1;
                      return (
                        <ItemGroup key={index}>
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
                  : formData.actions.map((action, index) => {
                      const prefix = formData.actions.length > 1 ? `Action ${index + 1} - ` : "";
                      const isLast = index === formData.actions.length - 1;
                      return (
                        <ItemGroup key={index}>
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
          </PreviewCard>
        </FormSection>

        <FormSection label='SETUP ACTION DEPLOY'>
          <DeployOptionsCard>
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
              <ActionButton variant='secondary' onClick={onBack} data-testid='review-back-button'>
                BACK
              </ActionButton>
              <ActionButton
                variant='primary'
                onClick={handleInitiate}
                disabled={proposePreApproval && !isValid}
                data-testid='initiate-button'
              >
                INITIATE
              </ActionButton>
            </ButtonRow>
          </DeployOptionsCard>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};

const ItemGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
});
