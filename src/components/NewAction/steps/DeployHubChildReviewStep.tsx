import { useState } from "react";
import { Box, Typography, styled } from "@mui/material";
import { Address } from "viem";
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

// Tooltip content
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

  // Handle initiate
  const handleInitiate = () => {
    onInitiate(proposeTransaction);
  };

  // Get recipient from hub info
  const recipient = hubInfo?.recipient || "Unknown";

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='Deploy Child' />

        {/* Preview Action Section */}
        <FormSection label='PREVIEW ACTION'>
          <ActionPreviewCard>
            <PreviewHeader>
              <ActionTitle>{formData.title || "Untitled Transaction"}</ActionTitle>
              <PreviewRow>
                <FactoryInfo>
                  <FactoryLabel>FROM HUB</FactoryLabel>
                  <VectorSquareIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <FactoryValue>HUB: {HUB_DISPLAY_NAMES[ActionFactoryType.CAPPED_TOKEN_TRANSFERS]}</FactoryValue>
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
            <CheckboxRow style={{ borderBottom: "none" }}>
              <CheckboxLeft>
                <Checkbox checked={proposeTransaction} onClick={() => setProposeTransaction(!proposeTransaction)}>
                  {proposeTransaction && <CheckIcon size={12} color={canonHeaderTokens.background.layer0} />}
                </Checkbox>
                <CheckboxLabel>Propose Transaction</CheckboxLabel>
              </CheckboxLeft>
              <RightContent>
                <PathTag $isFastPath={isFastPath}>
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
  textTransform: "uppercase",
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

const PathTag = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const PathLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: $isFastPath ? canonHeaderTokens.brand.green : canonHeaderTokens.status.red,
}));

const InfoIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
