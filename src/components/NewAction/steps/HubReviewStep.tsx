import { useState } from "react";
import { Box } from "@mui/material";
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
import { Layers2Icon, PlusIcon, MinusIcon, CheckIcon, InfoIcon, ZapOffIcon, LockIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { DurationInput } from "~/components/shared/DurationInput";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { usePreApprovalDuration } from "~/hooks";
import { ActionFactoryType } from "~/types/canon-guard";
import { HUB_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  Breadcrumb,
  FormSection,
  ActionButton,
  ButtonRow,
  StepContentWrapper as ContentWrapper,
  StepPageContainer as Container,
} from "../shared";
import type { CappedTransferHubFormData } from "./index";

const TOOLTIP_DEPLOY_SAVE =
  "Deploy and save for future use. Once deployed, you can propose or pre-approve it later. Deploying and saving doesn't require multisig.";
const TOOLTIP_PROPOSE_PREAPPROVAL =
  "Request signatures from Safe signers. This transaction will follow the fast-path with a 1 hour delay.";

interface HubReviewStepProps {
  formData: CappedTransferHubFormData;
  guardAddress: Address;
  chainId: number;
  onBack: () => void;
  onInitiate: (proposePreApproval: boolean, approvalDurationSeconds?: bigint) => void;
  onNavigateToCreate: () => void;
  onEdit: () => void;
}

export const HubReviewStep = ({
  formData,
  guardAddress,
  chainId,
  onBack,
  onInitiate,
  onNavigateToCreate,
  onEdit,
}: HubReviewStepProps) => {
  const [parametersExpanded, setParametersExpanded] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Record<number, boolean>>({});
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
    onInitiate(proposePreApproval, proposePreApproval ? totalDurationSeconds : undefined);
  };

  const toggleToken = (index: number) => {
    setExpandedTokens((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const epochDisplay = `${formData.epochLength} ${formData.epochUnit}`;

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action from Hub' />

        <FormSection label='PREVIEW HUB' data-testid='hub-preview-section'>
          <PreviewCard>
            <PreviewHeader>
              <PreviewTitle>{formData.title || "Untitled Hub"}</PreviewTitle>
              <PreviewRow>
                <PreviewInfo>
                  <PreviewLabel>HUB FACTORY</PreviewLabel>
                  <Layers2Icon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <PreviewValue>HUB: {HUB_DISPLAY_NAMES[ActionFactoryType.CAPPED_TOKEN_TRANSFERS]}</PreviewValue>
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
                <ParameterRow>
                  <ParameterLabel>Recipient</ParameterLabel>
                  {formData.recipientAddress ? (
                    <CopyableText
                      text={formData.recipientAddress}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent10}
                    >
                      <ParameterValue>{formData.recipientAddress}</ParameterValue>
                    </CopyableText>
                  ) : (
                    <ParameterValue>-</ParameterValue>
                  )}
                </ParameterRow>
                <ParameterRow $noBorder>
                  <ParameterLabel>Epoch</ParameterLabel>
                  <CopyableText text={epochDisplay} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
                    <ParameterValue>{epochDisplay}</ParameterValue>
                  </CopyableText>
                </ParameterRow>
              </ParametersContent>
            )}

            {formData.tokens.map((token, index) => (
              <Box key={index}>
                <ParametersToggle onClick={() => toggleToken(index)}>
                  <ToggleContent>
                    {expandedTokens[index] ? (
                      <MinusIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                    ) : (
                      <PlusIcon size={12} color={canonHeaderTokens.foreground.accent20} />
                    )}
                    <ToggleLabel>TOKEN {index + 1}</ToggleLabel>
                  </ToggleContent>
                </ParametersToggle>

                {expandedTokens[index] && (
                  <ParametersContent>
                    <ParameterRow>
                      <ParameterLabel>Address</ParameterLabel>
                      {token.address ? (
                        <CopyableText
                          text={token.address}
                          iconSize={10}
                          iconColor={canonHeaderTokens.foreground.accent10}
                        >
                          <ParameterValue>{token.address}</ParameterValue>
                        </CopyableText>
                      ) : (
                        <ParameterValue>-</ParameterValue>
                      )}
                    </ParameterRow>
                    <ParameterRow $noBorder>
                      <ParameterLabel>Amount</ParameterLabel>
                      {token.amount ? (
                        <CopyableText
                          text={token.amount}
                          iconSize={10}
                          iconColor={canonHeaderTokens.foreground.accent10}
                        >
                          <ParameterValue>{token.amount}</ParameterValue>
                        </CopyableText>
                      ) : (
                        <ParameterValue>-</ParameterValue>
                      )}
                    </ParameterRow>
                  </ParametersContent>
                )}
              </Box>
            ))}
          </PreviewCard>
        </FormSection>

        <FormSection label='SETUP HUB DEPLOY'>
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
                <CheckboxLabel>Deploy & Save Hub</CheckboxLabel>
              </CheckboxLeft>
              <StyledTooltip title={TOOLTIP_DEPLOY_SAVE} placement='top-end'>
                <InfoIconWrapper>
                  <InfoIcon size={14} color={canonHeaderTokens.foreground.accent30} />
                </InfoIconWrapper>
              </StyledTooltip>
            </CheckboxRow>

            <CheckboxRow style={{ borderBottom: proposePreApproval ? "none" : "none" }}>
              <CheckboxLeft>
                <Checkbox
                  checked={proposePreApproval}
                  onClick={() => setProposePreApproval(!proposePreApproval)}
                  data-testid='hub-pre-approval-checkbox'
                >
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
              <ActionButton variant='secondary' onClick={onBack} data-testid='hub-review-back-button'>
                BACK
              </ActionButton>
              <ActionButton
                variant='primary'
                onClick={handleInitiate}
                disabled={proposePreApproval && !isValid}
                data-testid='hub-initiate-button'
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
