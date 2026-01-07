import { useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { keccak256, toBytes, slice } from "viem";
import { BoxIcon, AsteriskIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { isValidAddress, isValidSignature, isValidHexData, isValidValue } from "~/utils/validation";
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
} from "../shared";
import type { SimpleActionFormData, SimpleActionItem } from "./index";

// Compute function selector from signature (first 4 bytes of keccak256)
const computeSelector = (signature: string): string | null => {
  if (!signature.trim()) return null;
  try {
    const hash = keccak256(toBytes(signature));
    return slice(hash, 0, 4); // Returns "0x" + 8 hex chars
  } catch {
    return null;
  }
};

interface SimpleActionFormStepProps {
  formData: SimpleActionFormData;
  onFormDataChange: (data: SimpleActionFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigateToCreate: () => void;
  onChangeFactory: () => void;
}

export const SimpleActionFormStep = ({
  formData,
  onFormDataChange,
  onContinue,
  onBack,
  onNavigateToCreate,
  onChangeFactory,
}: SimpleActionFormStepProps) => {
  // Update title field
  const updateTitle = (value: string) => {
    onFormDataChange({ ...formData, title: value });
  };

  // Update a specific action item
  const updateAction = (index: number, field: keyof SimpleActionItem, value: string) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    onFormDataChange({ ...formData, actions: newActions });
  };

  // Add a new action item
  const addAction = () => {
    onFormDataChange({
      ...formData,
      actions: [...formData.actions, { target: "", signature: "", data: "", value: "" }],
    });
  };

  // Remove an action item
  const removeAction = (index: number) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    onFormDataChange({ ...formData, actions: newActions });
  };

  // Validation errors and warnings for each action
  const { errors, warnings } = useMemo(() => {
    const actionErrors = formData.actions.map((action) => {
      const selector = computeSelector(action.signature);
      const dataTrimmed = action.data.trim().toLowerCase();
      const hasDuplicateSelector =
        selector && dataTrimmed.length >= 10 && dataTrimmed.startsWith(selector.toLowerCase());

      return {
        errors: {
          target: action.target.trim() && !isValidAddress(action.target) ? "Invalid address format" : undefined,
          signature:
            action.signature.trim() && !isValidSignature(action.signature)
              ? "Invalid signature format (e.g. transfer(address,uint256))"
              : undefined,
          data:
            action.data.trim() && !isValidHexData(action.data)
              ? "Must be a valid hex string starting with 0x"
              : undefined,
          value: action.value.trim() && !isValidValue(action.value) ? "Must be a valid number" : undefined,
        },
        warnings: {
          data: hasDuplicateSelector ? "The encoded parameters should not contain the function selector." : undefined,
        },
      };
    });

    return {
      errors: actionErrors.map((e) => e.errors),
      warnings: actionErrors.map((e) => e.warnings),
    };
  }, [formData.actions]);

  const hasErrors = errors.some((e) => e.target || e.signature || e.data || e.value);

  const isValid =
    formData.title.trim() !== "" &&
    formData.actions.length > 0 &&
    formData.actions.every((action) => action.target.trim() !== "" && action.signature.trim() !== "") &&
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
              <FactoryValue>{FACTORY_DISPLAY_NAMES[ActionFactoryType.SIMPLE_ACTIONS]}</FactoryValue>
            </LeftContent>
            <ChangeButton>CHANGE</ChangeButton>
          </FactorySelector>

          {/* Transaction Title Card */}
          <TransactionTitleCard>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Deposit 1 ETH to Vault...'
                  value={formData.title}
                  onChange={updateTitle}
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
            {/* Action Items */}
            {formData.actions.map((action, index) => (
              <ItemSection key={index}>
                {/* Divider header with action number and remove button */}
                <ItemDividerHeader
                  label={`Action ${index + 1}`}
                  showRemove={formData.actions.length > 1}
                  onRemove={() => removeAction(index)}
                />

                {/* Action Fields */}
                <ItemFieldsSection>
                  <FormInput
                    label='Target Address'
                    placeholder='0x...'
                    value={action.target}
                    onChange={(value) => updateAction(index, "target", value)}
                    error={errors[index]?.target}
                  />
                  <FormInput
                    label='Function Signature'
                    placeholder='e.g. transfer(address,uint256)'
                    value={action.signature}
                    onChange={(value) => updateAction(index, "signature", value)}
                    error={errors[index]?.signature}
                  />
                  <FormInput
                    label='Encoded Parameters'
                    placeholder='0x... (encoded arguments, without selector)'
                    value={action.data}
                    onChange={(value) => updateAction(index, "data", value)}
                    error={errors[index]?.data}
                    warning={warnings[index]?.data}
                  />
                  <FormInput
                    label='Value (wei)'
                    placeholder='0'
                    value={action.value}
                    onChange={(value) => updateAction(index, "value", value)}
                    error={errors[index]?.value}
                  />
                </ItemFieldsSection>
              </ItemSection>
            ))}

            {/* Info Row with ADD ACTION button */}
            <AddItemRow
              infoText='You can add multiple actions in one transaction.'
              addButtonText='ADD ACTION'
              onAdd={addAction}
            />

            {/* Action Buttons Row */}
            <ActionButtonRow>
              <ButtonsContainer>
                <ActionButton variant='secondary' onClick={onBack}>
                  BACK
                </ActionButton>
                <ActionButton variant='primary' onClick={onContinue} disabled={!isValid}>
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
