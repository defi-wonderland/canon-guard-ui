import { useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import { isAddress, isHex, keccak256, toBytes, slice } from "viem";
import { BoxIcon, AsteriskIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { Breadcrumb, FormSection, FormInput, ActionButton, ButtonRow } from "../shared";
import type { SimpleActionFormData } from "./index";

// Validation helpers
const isValidAddress = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  return isAddress(value);
};

const isValidSignature = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid
  // Basic validation: should be a function signature like "transfer(address,uint256)"
  return /^[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)$/.test(value);
};

const isValidHexData = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid
  if (value === "0x") return true; // Empty bytes
  return isHex(value);
};

const isValidValue = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && /^[0-9]*\.?[0-9]*$/.test(value);
};

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
  const updateField = (field: keyof SimpleActionFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // Validation errors and warnings
  const { errors, warnings } = useMemo(() => {
    const selector = computeSelector(formData.signature);
    const dataTrimmed = formData.data.trim().toLowerCase();

    // Check if data starts with the computed selector (potential duplication)
    const hasDuplicateSelector = selector && dataTrimmed.length >= 10 && dataTrimmed.startsWith(selector.toLowerCase());

    return {
      errors: {
        target: formData.target.trim() && !isValidAddress(formData.target) ? "Invalid address format" : undefined,
        signature:
          formData.signature.trim() && !isValidSignature(formData.signature)
            ? "Invalid signature format (e.g. transfer(address,uint256))"
            : undefined,
        data:
          formData.data.trim() && !isValidHexData(formData.data)
            ? "Must be a valid hex string starting with 0x"
            : undefined,
        value: formData.value.trim() && !isValidValue(formData.value) ? "Must be a valid number" : undefined,
      },
      warnings: {
        data: hasDuplicateSelector ? "The encoded parameters should not contain the function selector." : undefined,
      },
    };
  }, [formData.target, formData.signature, formData.data, formData.value]);

  const hasErrors = Boolean(errors.target || errors.signature || errors.data || errors.value);

  const isValid =
    formData.title.trim() !== "" && formData.target.trim() !== "" && formData.signature.trim() !== "" && !hasErrors;

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
                label='Target Address'
                placeholder='0x...'
                value={formData.target}
                onChange={(value) => updateField("target", value)}
                error={errors.target}
              />
              <FormInput
                label='Function Signature'
                placeholder='e.g. transfer(address,uint256)'
                value={formData.signature}
                onChange={(value) => updateField("signature", value)}
                error={errors.signature}
              />
              <FormInput
                label='Encoded Parameters'
                placeholder='0x... (encoded arguments, without selector)'
                value={formData.data}
                onChange={(value) => updateField("data", value)}
                error={errors.data}
                warning={warnings.data}
              />
              <FormInput
                label='Value (wei)'
                placeholder='0'
                value={formData.value}
                onChange={(value) => updateField("value", value)}
                error={errors.value}
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
