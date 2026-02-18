import { useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { isAddress } from "viem";
import { Layers2Icon, AsteriskIcon, PlusIcon, TrashIcon, InfoIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { HUB_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  Breadcrumb,
  FormSection,
  FormInput,
  TokenSelector,
  ActionButton,
  HubSelector,
  LeftContent,
  ChangeButton,
  TransactionTitleCard,
  CardContent,
  FormInputWrapper,
  PublicBadge,
  EncryptionNote,
  NoteText,
  LearnMoreLink,
  StepContentWrapper as ContentWrapper,
  StepPageContainer as Container,
} from "../shared";
import type { CappedTransferHubFormData, TimeUnit } from "./index";

// Validation helpers
const isValidAddress = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  return isAddress(value);
};

const isValidAmount = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && /^[0-9]*\.?[0-9]*$/.test(value);
};

const isValidEpochLength = (value: string): boolean => {
  if (!value.trim()) return true;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && /^[0-9]*\.?[0-9]*$/.test(value);
};

const TIME_UNIT_OPTIONS = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
  { label: "Months", value: "months" },
];

interface CappedTransferHubFormStepProps {
  formData: CappedTransferHubFormData;
  onFormDataChange: (data: CappedTransferHubFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigateToCreate: () => void;
  onChangeHub: () => void;
}

export const CappedTransferHubFormStep = ({
  formData,
  onFormDataChange,
  onContinue,
  onBack,
  onNavigateToCreate,
  onChangeHub,
}: CappedTransferHubFormStepProps) => {
  const updateField = <K extends keyof CappedTransferHubFormData>(field: K, value: CappedTransferHubFormData[K]) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const updateToken = (index: number, field: "address" | "amount", value: string) => {
    const newTokens = [...formData.tokens];
    newTokens[index] = { ...newTokens[index], [field]: value };
    updateField("tokens", newTokens);
  };

  const addToken = () => {
    updateField("tokens", [...formData.tokens, { address: "", amount: "" }]);
  };

  const removeToken = (index: number) => {
    if (formData.tokens.length > 1) {
      const newTokens = formData.tokens.filter((_, i) => i !== index);
      updateField("tokens", newTokens);
    }
  };

  // Validation errors
  const errors = useMemo(() => {
    const tokenErrors = formData.tokens.map((token) => ({
      address: token.address.trim() && !isValidAddress(token.address) ? "Invalid address format" : undefined,
      amount: token.amount.trim() && !isValidAmount(token.amount) ? "Must be a positive number" : undefined,
    }));

    return {
      recipientAddress:
        formData.recipientAddress.trim() && !isValidAddress(formData.recipientAddress)
          ? "Invalid address format"
          : undefined,
      epochLength:
        formData.epochLength.trim() && !isValidEpochLength(formData.epochLength)
          ? "Must be a positive number"
          : undefined,
      tokens: tokenErrors,
    };
  }, [formData.recipientAddress, formData.epochLength, formData.tokens]);

  const hasErrors = useMemo(() => {
    if (errors.recipientAddress || errors.epochLength) return true;
    return errors.tokens.some((t) => t.address || t.amount);
  }, [errors]);

  const isValid = useMemo(() => {
    // All required fields must be filled
    if (!formData.title.trim()) return false;
    if (!formData.recipientAddress.trim()) return false;
    if (!formData.epochLength.trim()) return false;

    // All tokens must have address and amount
    for (const token of formData.tokens) {
      if (!token.address.trim() || !token.amount.trim()) return false;
    }

    return !hasErrors;
  }, [formData, hasErrors]);

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action from Hub' />

        {/* Set Hub Details Section */}
        <FormSection label='NEW HUB'>
          {/* Hub Selector */}
          <HubSelector $interactive onClick={onChangeHub}>
            <LeftContent>
              <HubLabel>CANON FACTORY</HubLabel>
              <Layers2Icon size={16} color={canonHeaderTokens.foreground.accent20} />
              <HubValue>HUB: {HUB_DISPLAY_NAMES[ActionFactoryType.CAPPED_TOKEN_TRANSFERS]}</HubValue>
            </LeftContent>
            <ChangeButton>CHANGE</ChangeButton>
          </HubSelector>

          {/* Transaction Title Card */}
          <TransactionTitleCard data-testid='hub-title-card'>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Transfer 300 USDC to John...'
                  value={formData.title}
                  onChange={(value) => updateField("title", value)}
                  data-testid='hub-title-input'
                />
                <PublicBadge>Public</PublicBadge>
              </FormInputWrapper>
              <EncryptionNote>
                <AsteriskIcon size={20} color={canonHeaderTokens.amber.base} />
                <NoteText>
                  You can encrypt transaction titles to keep them private. <LearnMoreLink>Learn more</LearnMoreLink>
                </NoteText>
              </EncryptionNote>
            </CardContent>
          </TransactionTitleCard>
        </FormSection>

        {/* Set Action Parameters Section - ONE unified card */}
        <FormSection label='SET ACTION PARAMETERS'>
          <UnifiedParametersCard>
            {/* Recipient and Epoch Fields */}
            <ParametersSection>
              <FormInput
                label='Recipient Address'
                placeholder='0x...'
                value={formData.recipientAddress}
                onChange={(value) => updateField("recipientAddress", value)}
                error={errors.recipientAddress}
                data-testid='hub-recipient-input'
              />
              <EpochRow>
                <EpochInputWrapper>
                  <FormInput
                    label='Epoch Lengths'
                    placeholder='1'
                    value={formData.epochLength}
                    onChange={(value) => updateField("epochLength", value)}
                    error={errors.epochLength}
                    type='number'
                    data-testid='hub-epoch-length-input'
                  />
                </EpochInputWrapper>
                <UnitSelectWrapper>
                  <FormInput
                    value={formData.epochUnit}
                    onChange={(value) => updateField("epochUnit", value as TimeUnit)}
                    type='select'
                    selectOptions={TIME_UNIT_OPTIONS}
                    data-testid='hub-epoch-unit-select'
                  />
                </UnitSelectWrapper>
              </EpochRow>
            </ParametersSection>

            {/* Token Sections */}
            {formData.tokens.map((token, index) => (
              <TokenSection key={index}>
                {/* Token Divider Header */}
                <TokenDividerHeader>
                  <TokenLabel>TOKEN {index + 1}</TokenLabel>
                  {formData.tokens.length > 1 && (
                    <RemoveButton className='remove-button' onClick={() => removeToken(index)}>
                      <TrashIcon size={14} color={canonHeaderTokens.foreground.accent20} />
                      <RemoveText>REMOVE</RemoveText>
                    </RemoveButton>
                  )}
                </TokenDividerHeader>

                {/* Token Fields */}
                <TokenFieldsSection>
                  <TokenSelector
                    label='Token Address'
                    value={token.address}
                    onChange={(value) => updateToken(index, "address", value)}
                    error={errors.tokens[index]?.address}
                    data-testid={index === 0 ? "hub-token-address-input" : undefined}
                  />
                  <FormInput
                    label='Token Amount'
                    placeholder='0.00'
                    value={token.amount}
                    onChange={(value) => updateToken(index, "amount", value)}
                    error={errors.tokens[index]?.amount}
                    data-testid={index === 0 ? "hub-token-amount-input" : undefined}
                  />
                </TokenFieldsSection>
              </TokenSection>
            ))}

            {/* Info Row with ADD TOKEN button */}
            <InfoRow>
              <InfoContent>
                <InfoIcon size={16} color={canonHeaderTokens.foreground.accent30} />
                <InfoText>You can transfer multiple tokens at once.</InfoText>
              </InfoContent>
              <AddTokenButton onClick={addToken}>
                <AddTokenText>ADD TOKEN</AddTokenText>
                <PlusIcon size={14} color={canonHeaderTokens.foreground.accent10} />
              </AddTokenButton>
            </InfoRow>

            {/* Action Buttons Row */}
            <ActionButtonRow>
              <ButtonsContainer>
                <ActionButton variant='secondary' onClick={onBack} data-testid='hub-form-back-button'>
                  BACK
                </ActionButton>
                <ActionButton
                  variant='primary'
                  onClick={onContinue}
                  disabled={!isValid}
                  data-testid='hub-form-continue-button'
                >
                  CONTINUE
                </ActionButton>
              </ButtonsContainer>
            </ActionButtonRow>
          </UnifiedParametersCard>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};

const HubLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const HubValue = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
});

// Unified card for SET ACTION PARAMETERS section
const UnifiedParametersCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

// Section containing Recipient Address and Epoch fields
const ParametersSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const EpochRow = styled(Box)({
  display: "flex",
  gap: "16px",
  alignItems: "flex-end",
});

const EpochInputWrapper = styled(Box)({
  flex: 1,
});

const UnitSelectWrapper = styled(Box)({
  flex: 1,
});

// Token section wrapper - handles hover state for remove button
const TokenSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  "&:hover .remove-button": {
    opacity: 1,
  },
});

// Token divider header with layer1-variation background
const TokenDividerHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
});

const TokenLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

// Remove button - hidden by default, shown on hover
const RemoveButton = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  opacity: 0,
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.7,
  },
});

const RemoveText = styled(Typography)({
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

// Token fields section
const TokenFieldsSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

// Info row with ADD TOKEN button
const InfoRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
});

const InfoContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const InfoText = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

const AddTokenButton = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.7,
  },
});

const AddTokenText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
  letterSpacing: "0.6px",
});

// Action buttons row with dashed border
const ActionButtonRow = styled(Box)({
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const ButtonsContainer = styled(Box)({
  display: "flex",
  gap: "16px",
  width: "100%",
});
