import { useMemo } from "react";
import { keccak256, toBytes, slice } from "viem";
import { BoxIcon, AsteriskIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { isValidAddress, isValidHexData, isValidValue } from "~/utils/validation";
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
import type { ArbitraryActionFormData, ArbitraryActionItem } from "./index";

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

// Extract selector from calldata (first 4 bytes)
const extractSelectorFromCalldata = (calldata: string): string | null => {
  const trimmed = calldata.trim().toLowerCase();
  if (!trimmed.startsWith("0x") || trimmed.length < 10) return null;
  return trimmed.slice(0, 10);
};

interface ArbitraryActionFormStepProps {
  formData: ArbitraryActionFormData;
  onFormDataChange: (data: ArbitraryActionFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigateToCreate: () => void;
  onChangeFactory: () => void;
}

export const ArbitraryActionFormStep = ({
  formData,
  onFormDataChange,
  onContinue,
  onBack,
  onNavigateToCreate,
  onChangeFactory,
}: ArbitraryActionFormStepProps) => {
  // Update title field
  const updateTitle = (value: string) => {
    onFormDataChange({ ...formData, title: value });
  };

  // Update a specific action item
  const updateAction = (index: number, field: keyof ArbitraryActionItem, value: string) => {
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

  // Validation errors for each action
  const errors = useMemo(() => {
    return formData.actions.map((action) => {
      const dataTrimmed = action.data.trim();
      const signatureTrimmed = action.signature.trim();

      // Calldata validation - must have selector (at least 10 chars: 0x + 8 hex)
      let dataError: string | undefined;
      if (dataTrimmed) {
        if (!dataTrimmed.startsWith("0x")) {
          dataError = "Must be a valid hex string starting with 0x";
        } else if (dataTrimmed.length < 10) {
          dataError = "Calldata must include the function selector (at least 10 characters)";
        } else if (!isValidHexData(dataTrimmed)) {
          dataError = "Must be a valid hex string";
        }
      }

      // Signature validation - optional, but if provided must match calldata selector
      let signatureError: string | undefined;
      if (signatureTrimmed) {
        // Basic format check: must have parentheses
        if (!signatureTrimmed.includes("(") || !signatureTrimmed.includes(")")) {
          signatureError = "Invalid signature format (e.g. transfer(address,uint256))";
        } else if (dataTrimmed.length >= 10) {
          // Validate that signature matches calldata selector
          const computedSelector = computeSelector(signatureTrimmed);
          const calldataSelector = extractSelectorFromCalldata(dataTrimmed);

          if (computedSelector && calldataSelector && computedSelector.toLowerCase() !== calldataSelector) {
            signatureError = "Signature does not match the calldata selector";
          }
        }
      }

      return {
        target: action.target.trim() && !isValidAddress(action.target) ? "Invalid address format" : undefined,
        data: dataError,
        signature: signatureError,
        value: action.value.trim() && !isValidValue(action.value) ? "Must be a valid number" : undefined,
      };
    });
  }, [formData.actions]);

  const hasErrors = errors.some((e) => e.target || e.signature || e.data || e.value);

  // Validation: title required, at least one action with target and calldata (with selector)
  const isValid =
    formData.title.trim() !== "" &&
    formData.actions.length > 0 &&
    formData.actions.every((action) => {
      const dataTrimmed = action.data.trim();
      return (
        action.target.trim() !== "" &&
        dataTrimmed.startsWith("0x") &&
        dataTrimmed.length >= 10 &&
        isValidHexData(dataTrimmed)
      );
    }) &&
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
              <FactoryValue>{FACTORY_DISPLAY_NAMES[ActionFactoryType.ARBITRARY_ACTIONS]}</FactoryValue>
            </LeftContent>
            <ChangeButton>CHANGE</ChangeButton>
          </FactorySelector>

          {/* Transaction Title Card */}
          <TransactionTitleCard data-testid='transaction-title-label'>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Deposit 1 ETH to Vault...'
                  value={formData.title}
                  onChange={updateTitle}
                  data-testid='transaction-title-input'
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

                {/* Action Fields - Calldata first, then signature (optional) */}
                <ItemFieldsSection>
                  <FormInput
                    label='Target Address'
                    placeholder='0x...'
                    value={action.target}
                    onChange={(value) => updateAction(index, "target", value)}
                    error={errors[index]?.target}
                    data-testid={index === 0 ? "target-address-input" : undefined}
                  />
                  <FormInput
                    label='Calldata'
                    placeholder='0x... (full calldata including selector)'
                    value={action.data}
                    onChange={(value) => updateAction(index, "data", value)}
                    error={errors[index]?.data}
                    data-testid={index === 0 ? "calldata-input" : undefined}
                  />
                  <FormInput
                    label='Function Signature (optional)'
                    placeholder='e.g. transfer(address,uint256)'
                    value={action.signature}
                    onChange={(value) => updateAction(index, "signature", value)}
                    error={errors[index]?.signature}
                    data-testid={index === 0 ? "signature-input" : undefined}
                  />
                  <FormInput
                    label='Value (wei)'
                    placeholder='0'
                    value={action.value}
                    onChange={(value) => updateAction(index, "value", value)}
                    error={errors[index]?.value}
                    data-testid={index === 0 ? "value-input" : undefined}
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
                <ActionButton variant='secondary' onClick={onBack} data-testid='form-back-button'>
                  BACK
                </ActionButton>
                <ActionButton
                  variant='primary'
                  onClick={onContinue}
                  disabled={!isValid}
                  data-testid='form-continue-button'
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
