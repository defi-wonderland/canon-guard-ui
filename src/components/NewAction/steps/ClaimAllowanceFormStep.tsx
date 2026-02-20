import { useMemo } from "react";
import { Box, styled } from "@mui/material";
import { isAddress } from "viem";
import { BoxIcon, AsteriskIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  Breadcrumb,
  FormSection,
  FormInput,
  TokenSelector,
  ActionButton,
  ButtonRow,
  FactorySelector,
  FactoryLabel,
  FactoryValue,
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
import type { ClaimAllowanceFormData } from "./index";

// Validation helpers
const isValidAddress = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  return isAddress(value);
};

interface ClaimAllowanceFormStepProps {
  formData: ClaimAllowanceFormData;
  onFormDataChange: (data: ClaimAllowanceFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigateToCreate: () => void;
  onChangeFactory: () => void;
}

export const ClaimAllowanceFormStep = ({
  formData,
  onFormDataChange,
  onContinue,
  onBack,
  onNavigateToCreate,
  onChangeFactory,
}: ClaimAllowanceFormStepProps) => {
  const updateField = (field: keyof ClaimAllowanceFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // Validation errors
  const errors = useMemo(
    () => ({
      token: formData.token.trim() && !isValidAddress(formData.token) ? "Invalid address format" : undefined,
      tokenOwner:
        formData.tokenOwner.trim() && !isValidAddress(formData.tokenOwner) ? "Invalid address format" : undefined,
      tokenRecipient:
        formData.tokenRecipient.trim() && !isValidAddress(formData.tokenRecipient)
          ? "Invalid address format"
          : undefined,
    }),
    [formData.token, formData.tokenOwner, formData.tokenRecipient],
  );

  const hasErrors = Boolean(errors.token || errors.tokenOwner || errors.tokenRecipient);

  const isValid =
    formData.title.trim() !== "" &&
    formData.token.trim() !== "" &&
    formData.tokenOwner.trim() !== "" &&
    formData.tokenRecipient.trim() !== "" &&
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
              <FactoryValue>{FACTORY_DISPLAY_NAMES[ActionFactoryType.ALLOWANCE_CLAIMOR]}</FactoryValue>
            </LeftContent>
            <ChangeButton>CHANGE</ChangeButton>
          </FactorySelector>

          {/* Transaction Title Card */}
          <TransactionTitleCard>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Claim USDC allowance from Treasury...'
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
              <TokenSelector
                label='Token Address'
                value={formData.token}
                onChange={(value) => updateField("token", value)}
                error={errors.token}
              />
              <FormInput
                label='Token Owner Address'
                placeholder='0x...'
                value={formData.tokenOwner}
                onChange={(value) => updateField("tokenOwner", value)}
                error={errors.tokenOwner}
              />
              <FormInput
                label='Token Recipient Address'
                placeholder='0x...'
                value={formData.tokenRecipient}
                onChange={(value) => updateField("tokenRecipient", value)}
                error={errors.tokenRecipient}
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

const ParametersCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});
