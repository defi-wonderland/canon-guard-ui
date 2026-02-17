import { useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { BoxIcon, AsteriskIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { isValidAddress, isValidAmount } from "~/utils/validation";
import {
  Breadcrumb,
  FormSection,
  FormInput,
  ActionButton,
  ItemsCard,
  ItemSection,
  ItemDividerHeader,
  ItemFieldsSection,
  AddItemRow,
  ActionButtonRow,
  ButtonsContainer,
  StepContentWrapper as ContentWrapper,
  StepPageContainer as Container,
} from "../shared";
import type { TransferFormData, TransferItem } from "./index";

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
  // Update title field
  const updateTitle = (value: string) => {
    onFormDataChange({ ...formData, title: value });
  };

  // Update a specific transfer item
  const updateTransfer = (index: number, field: keyof TransferItem, value: string) => {
    const newTransfers = [...formData.transfers];
    newTransfers[index] = { ...newTransfers[index], [field]: value };
    onFormDataChange({ ...formData, transfers: newTransfers });
  };

  // Add a new transfer item
  const addTransfer = () => {
    onFormDataChange({
      ...formData,
      transfers: [...formData.transfers, { tokenAddress: "", recipientAddress: "", amount: "" }],
    });
  };

  // Remove a transfer item
  const removeTransfer = (index: number) => {
    const newTransfers = formData.transfers.filter((_, i) => i !== index);
    onFormDataChange({ ...formData, transfers: newTransfers });
  };

  // Validation errors for each transfer item
  const errors = useMemo(() => {
    return formData.transfers.map((transfer) => ({
      tokenAddress:
        transfer.tokenAddress.trim() && !isValidAddress(transfer.tokenAddress) ? "Invalid address format" : undefined,
      recipientAddress:
        transfer.recipientAddress.trim() && !isValidAddress(transfer.recipientAddress)
          ? "Invalid address format"
          : undefined,
      amount: transfer.amount.trim() && !isValidAmount(transfer.amount) ? "Must be a valid number" : undefined,
    }));
  }, [formData.transfers]);

  const hasErrors = errors.some((e) => e.tokenAddress || e.recipientAddress || e.amount);

  const isValid =
    formData.title.trim() !== "" &&
    formData.transfers.length > 0 &&
    formData.transfers.every(
      (transfer) =>
        transfer.tokenAddress.trim() !== "" && transfer.recipientAddress.trim() !== "" && transfer.amount.trim() !== "",
    ) &&
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
          <TransactionTitleCard data-testid='transfer-title-card'>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Transfer 300 USDC to John...'
                  value={formData.title}
                  onChange={updateTitle}
                  data-testid='transfer-title-input'
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
          <ItemsCard>
            {/* Transfer Items */}
            {formData.transfers.map((transfer, index) => (
              <ItemSection key={index}>
                {/* Divider header with transfer number and remove button */}
                <ItemDividerHeader
                  label={`Transfer ${index + 1}`}
                  showRemove={formData.transfers.length > 1}
                  onRemove={() => removeTransfer(index)}
                />

                {/* Transfer Fields */}
                <ItemFieldsSection>
                  <FormInput
                    label='Token Address'
                    placeholder='0x...'
                    value={transfer.tokenAddress}
                    onChange={(value) => updateTransfer(index, "tokenAddress", value)}
                    error={errors[index]?.tokenAddress}
                    data-testid={index === 0 ? "transfer-token-address-input" : undefined}
                  />
                  <FormInput
                    label='Recipient Address'
                    placeholder='0x...'
                    value={transfer.recipientAddress}
                    onChange={(value) => updateTransfer(index, "recipientAddress", value)}
                    error={errors[index]?.recipientAddress}
                    data-testid={index === 0 ? "transfer-recipient-address-input" : undefined}
                  />
                  <FormInput
                    label='Amount'
                    placeholder='0'
                    value={transfer.amount}
                    onChange={(value) => updateTransfer(index, "amount", value)}
                    error={errors[index]?.amount}
                    data-testid={index === 0 ? "transfer-amount-input" : undefined}
                  />
                </ItemFieldsSection>
              </ItemSection>
            ))}

            {/* Info Row with ADD TRANSFER button */}
            <AddItemRow
              infoText='You can add multiple transfers in one action.'
              addButtonText='ADD TRANSFER'
              onAdd={addTransfer}
            />

            {/* Action Buttons Row */}
            <ActionButtonRow>
              <ButtonsContainer>
                <ActionButton variant='secondary' onClick={onBack} data-testid='transfer-form-back-button'>
                  BACK
                </ActionButton>
                <ActionButton
                  variant='primary'
                  onClick={onContinue}
                  disabled={!isValid}
                  data-testid='transfer-form-continue-button'
                >
                  CONTINUE
                </ActionButton>
              </ButtonsContainer>
            </ActionButtonRow>
          </ItemsCard>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};

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
