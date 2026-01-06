import { useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { isAddress } from "viem";
import { BoxIcon, AsteriskIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { Breadcrumb, FormSection, FormInput, ActionButton, ButtonRow } from "../shared";
import type { TransferFormData } from "./index";

// Validation helpers
const isValidAddress = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  return isAddress(value);
};

const isValidAmount = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && /^[0-9]*\.?[0-9]*$/.test(value);
};

interface TransferFormStepProps {
  formData: TransferFormData;
  onFormDataChange: (data: TransferFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigateToCreate: () => void;
  onChangeFactory: () => void;
}

export const TransferFormStep = ({
  formData,
  onFormDataChange,
  onContinue,
  onBack,
  onNavigateToCreate,
  onChangeFactory,
}: TransferFormStepProps) => {
  const updateField = (field: keyof TransferFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // Validation errors
  const errors = useMemo(
    () => ({
      tokenAddress:
        formData.tokenAddress.trim() && !isValidAddress(formData.tokenAddress) ? "Invalid address format" : undefined,
      recipientAddress:
        formData.recipientAddress.trim() && !isValidAddress(formData.recipientAddress)
          ? "Invalid address format"
          : undefined,
      amount: formData.amount.trim() && !isValidAmount(formData.amount) ? "Must be a valid number" : undefined,
    }),
    [formData.tokenAddress, formData.recipientAddress, formData.amount],
  );

  const hasErrors = Boolean(errors.tokenAddress || errors.recipientAddress || errors.amount);

  const isValid =
    formData.title.trim() !== "" &&
    formData.tokenAddress.trim() !== "" &&
    formData.recipientAddress.trim() !== "" &&
    formData.amount.trim() !== "" &&
    !hasErrors;

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action' />

        {/* Set Action Details Section */}
        <FormSection label='SET ACTION DETAILS'>
          {/* Factory Selector */}
          <FactorySelector onClick={onChangeFactory}>
            <LeftContent>
              <FactoryLabel>CANON FACTORY</FactoryLabel>
              <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
              <FactoryValue>{FACTORY_DISPLAY_NAMES[ActionFactoryType.SIMPLE_TRANSFERS]}</FactoryValue>
            </LeftContent>
            <ChangeButton>CHANGE</ChangeButton>
          </FactorySelector>

          {/* Transaction Title Card */}
          <TransactionTitleCard>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Transfer 300 USDC to John...'
                  value={formData.title}
                  onChange={(value) => updateField("title", value)}
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

        {/* Set Action Parameters Section */}
        <FormSection label='SET ACTION PARAMETERS'>
          <ParametersCard>
            <CardContent>
              <FormInput
                label='Token Address'
                placeholder='0x...'
                value={formData.tokenAddress}
                onChange={(value) => updateField("tokenAddress", value)}
                error={errors.tokenAddress}
              />
              <FormInput
                label='Recipient Address'
                placeholder='0x...'
                value={formData.recipientAddress}
                onChange={(value) => updateField("recipientAddress", value)}
                error={errors.recipientAddress}
              />
              <FormInput
                label='Amount'
                placeholder='0'
                value={formData.amount}
                onChange={(value) => updateField("amount", value)}
                error={errors.amount}
              />
            </CardContent>
            <ButtonRow>
              <ActionButton variant='secondary' onClick={onBack}>
                BACK
              </ActionButton>
              <ActionButton variant='primary' onClick={onContinue} disabled={!isValid}>
                CONTINUE
              </ActionButton>
            </ButtonRow>
          </ParametersCard>
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

const FactorySelector = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.85,
  },
});

const LeftContent = styled(Box)({
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
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
});

const ChangeButton = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const TransactionTitleCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
  position: "relative",
});

const CardContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "24px",
});

const FormInputWrapper = styled(Box)({
  position: "relative",
});

const PublicBadge = styled(Box)({
  position: "absolute",
  top: "42px",
  right: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.amber.border}`,
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: canonHeaderTokens.amber.text,
});

const EncryptionNote = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
});

const NoteText = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
});

const LearnMoreLink = styled("span")({
  textDecoration: "underline",
  cursor: "pointer",
});

const ParametersCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});
