import { useState } from "react";
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
  PathTag,
  PathLabel,
  InfoIconWrapper,
} from "~/components/NewAction/shared/SharedStyledComponents";
import {
  VectorSquareIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  InfoIcon,
  ZapIcon,
  ZapOffIcon,
  LockIcon,
} from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType, CappedTokenTransfersHubInfo } from "~/types/canon-guard";
import { HUB_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  Breadcrumb,
  FormSection,
  ActionButton,
  ButtonRow,
  StepContentWrapper as ContentWrapper,
  StepPageContainer as Container,
} from "../shared";
import type { HubChildFormData } from "./DeployHubChildFormStep";

const TOOLTIP_DEPLOY_SAVE = "Deploy and save for future use. Deploying and saving doesn't require multisig.";
const TOOLTIP_PROPOSE_TRANSACTION_SLOW =
  "Request signatures from Safe signers. This transaction will follow the slow path with a 7-day delay.";
const TOOLTIP_PROPOSE_TRANSACTION_FAST =
  "Request signatures from Safe signers. This transaction will follow the fast-path with a 1 hour delay.";

interface DeployHubChildReviewStepProps {
  hubAddress: Address;
  hubLabel: string;
  hubInfo: CappedTokenTransfersHubInfo | null;
  isFastPath: boolean;
  formData: HubChildFormData;
  onBack: () => void;
  onInitiate: (proposeTransaction: boolean) => void;
  onNavigateToCreate: () => void;
  onEdit: () => void;
}

export const DeployHubChildReviewStep = (props: DeployHubChildReviewStepProps) => {
  const { hubInfo, isFastPath, formData, onBack, onInitiate, onNavigateToCreate, onEdit } = props;
  const [parametersExpanded, setParametersExpanded] = useState(false);
  const [proposeTransaction, setProposeTransaction] = useState(true);

  const handleInitiate = () => {
    onInitiate(proposeTransaction);
  };

  const recipient = hubInfo?.recipient || "Unknown";

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='Deploy Child' />

        <FormSection label='PREVIEW ACTION'>
          <PreviewCard>
            <PreviewHeader>
              <PreviewTitle>{formData.title || "Untitled Transaction"}</PreviewTitle>
              <PreviewRow>
                <PreviewInfo>
                  <PreviewLabel>FROM HUB</PreviewLabel>
                  <VectorSquareIcon size={16} color={canonHeaderTokens.foreground.accent20} />
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
                  <ParameterLabel>Token</ParameterLabel>
                  {formData.token ? (
                    <CopyableText text={formData.token} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
                      <ParameterValue>{formData.token}</ParameterValue>
                    </CopyableText>
                  ) : (
                    <ParameterValue>-</ParameterValue>
                  )}
                </ParameterRow>
                <ParameterRow>
                  <ParameterLabel>Amount</ParameterLabel>
                  {formData.amount ? (
                    <CopyableText
                      text={formData.amount}
                      iconSize={10}
                      iconColor={canonHeaderTokens.foreground.accent10}
                    >
                      <ParameterValue>{formData.amount}</ParameterValue>
                    </CopyableText>
                  ) : (
                    <ParameterValue>-</ParameterValue>
                  )}
                </ParameterRow>
                <ParameterRow $noBorder>
                  <ParameterLabel>Recipient</ParameterLabel>
                  <CopyableText text={recipient} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
                    <ParameterValue>{recipient}</ParameterValue>
                  </CopyableText>
                </ParameterRow>
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

            <CheckboxRow style={{ borderBottom: "none" }}>
              <CheckboxLeft>
                <Checkbox checked={proposeTransaction} onClick={() => setProposeTransaction(!proposeTransaction)}>
                  {proposeTransaction && <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />}
                </Checkbox>
                <CheckboxLabel>Propose Transaction</CheckboxLabel>
              </CheckboxLeft>
              <RightContent>
                <PathTag>
                  {isFastPath ? (
                    <ZapIcon size={12} color={canonHeaderTokens.brand.green} />
                  ) : (
                    <ZapOffIcon size={12} color={canonHeaderTokens.status.red} />
                  )}
                  <PathLabel $isFastPath={isFastPath}>{isFastPath ? "FAST-PATH" : "SLOW-PATH"}</PathLabel>
                </PathTag>
                <StyledTooltip
                  title={isFastPath ? TOOLTIP_PROPOSE_TRANSACTION_FAST : TOOLTIP_PROPOSE_TRANSACTION_SLOW}
                  placement='top-end'
                >
                  <InfoIconWrapper>
                    <InfoIcon size={14} color={canonHeaderTokens.foreground.accent30} />
                  </InfoIconWrapper>
                </StyledTooltip>
              </RightContent>
            </CheckboxRow>

            <ButtonRow>
              <ActionButton variant='secondary' onClick={onBack}>
                BACK
              </ActionButton>
              <ActionButton variant='primary' onClick={handleInitiate}>
                INITIATE
              </ActionButton>
            </ButtonRow>
          </DeployOptionsCard>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};
