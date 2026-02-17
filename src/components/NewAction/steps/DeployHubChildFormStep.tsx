import { useState, useEffect, useMemo } from "react";
import { Box, Typography, styled, CircularProgress } from "@mui/material";
import { Address, formatUnits } from "viem";
import { VectorSquareIcon, AsteriskIcon, ChevronDownIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType, CappedTokenTransfersHubInfo, HubTokenConfig } from "~/types/canon-guard";
import { HUB_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  Breadcrumb,
  FormSection,
  FormInput,
  ActionButton,
  ButtonRow,
  HubSelector,
  LeftContent,
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

export interface HubChildFormData {
  title: string;
  token: Address | "";
  amount: string;
}

interface DeployHubChildFormStepProps {
  hubAddress: Address;
  hubLabel: string;
  hubInfo: CappedTokenTransfersHubInfo | null;
  isLoadingHubInfo: boolean;
  formData: HubChildFormData;
  onFormDataChange: (data: HubChildFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigateToCreate: () => void;
}

export const DeployHubChildFormStep = (props: DeployHubChildFormStepProps) => {
  const { hubLabel, hubInfo, isLoadingHubInfo, formData, onFormDataChange, onContinue, onBack, onNavigateToCreate } =
    props;
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);

  const updateField = (field: keyof HubChildFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // Get the selected token's config
  const selectedTokenConfig = useMemo((): HubTokenConfig | null => {
    if (!formData.token || !hubInfo) return null;
    return hubInfo.tokens.find((t) => t.address.toLowerCase() === formData.token.toLowerCase()) || null;
  }, [formData.token, hubInfo]);

  // Format cap left for display using the token's actual decimals
  const capLeftDisplay = useMemo(() => {
    if (!selectedTokenConfig) return null;
    return formatUnits(selectedTokenConfig.capLeft, selectedTokenConfig.decimals);
  }, [selectedTokenConfig]);

  // Validation
  const isValidAmount = (value: string): boolean => {
    if (!value.trim()) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && /^[0-9]*\.?[0-9]*$/.test(value);
  };

  const errors = useMemo(
    () => ({
      amount: formData.amount.trim() && !isValidAmount(formData.amount) ? "Must be a valid number" : undefined,
    }),
    [formData.amount],
  );

  const hasErrors = Boolean(errors.amount);

  const isValid = formData.title.trim() !== "" && formData.token !== "" && formData.amount.trim() !== "" && !hasErrors;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTokenDropdownOpen(false);
    };

    if (tokenDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [tokenDropdownOpen]);

  const handleTokenSelect = (tokenAddress: Address) => {
    onFormDataChange({ ...formData, token: tokenAddress });
    setTokenDropdownOpen(false);
  };

  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='Deploy Child' />

        {/* Hub Info Section */}
        <FormSection label='FROM HUB'>
          <HubSelector>
            <LeftContent>
              <HubLabel>HUB</HubLabel>
              <VectorSquareIcon size={16} color={canonHeaderTokens.foreground.accent20} />
              <HubValue>{HUB_DISPLAY_NAMES[ActionFactoryType.CAPPED_TOKEN_TRANSFERS]}</HubValue>
            </LeftContent>
            <HubName>{hubLabel}</HubName>
          </HubSelector>
        </FormSection>

        {/* Set Action Details Section */}
        <FormSection label='SET ACTION DETAILS'>
          {/* Transaction Title Card */}
          <TransactionTitleCard>
            <CardContent>
              <FormInputWrapper>
                <FormInput
                  label='Transaction Title'
                  placeholder='Eg. Transfer 1000 USDC to Operations...'
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
              {isLoadingHubInfo ? (
                <LoadingState>
                  <CircularProgress size={20} sx={{ color: canonHeaderTokens.brand.green }} />
                  <LoadingText>Loading hub configuration...</LoadingText>
                </LoadingState>
              ) : !hubInfo ? (
                <ErrorState>
                  <ErrorText>Failed to load hub configuration</ErrorText>
                </ErrorState>
              ) : (
                <>
                  {/* Token Dropdown */}
                  <InputWrapper>
                    <InputLabel>Token</InputLabel>
                    <TokenDropdownContainer onClick={(e) => e.stopPropagation()}>
                      <TokenDropdownButton onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}>
                        <TokenDropdownText $hasValue={!!formData.token}>
                          {formData.token || "Select a token"}
                        </TokenDropdownText>
                        <ChevronDownIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                      </TokenDropdownButton>
                      {tokenDropdownOpen && (
                        <TokenDropdownMenu>
                          {hubInfo.tokens.map((tokenConfig) => (
                            <TokenDropdownItem
                              key={tokenConfig.address}
                              onClick={() => handleTokenSelect(tokenConfig.address)}
                              $isSelected={tokenConfig.address.toLowerCase() === formData.token.toLowerCase()}
                            >
                              <TokenAddress>{tokenConfig.address}</TokenAddress>
                              <TokenCapInfo>Cap: {formatUnits(tokenConfig.cap, tokenConfig.decimals)}</TokenCapInfo>
                            </TokenDropdownItem>
                          ))}
                        </TokenDropdownMenu>
                      )}
                    </TokenDropdownContainer>
                  </InputWrapper>

                  {/* Recipient (Read-only) */}
                  <InputWrapper>
                    <InputLabel>Recipient</InputLabel>
                    <ReadOnlyInput>{hubInfo.recipient}</ReadOnlyInput>
                    <InputHint>Set by hub configuration</InputHint>
                  </InputWrapper>

                  {/* Amount */}
                  <FormInput
                    label='Amount'
                    placeholder='0'
                    value={formData.amount}
                    onChange={(value) => updateField("amount", value)}
                    error={errors.amount}
                  />

                  {/* Cap Remaining Info */}
                  {selectedTokenConfig && (
                    <CapRemainingInfo>Remaining for this epoch: {capLeftDisplay}</CapRemainingInfo>
                  )}
                </>
              )}
            </CardContent>
            <ButtonRow>
              <ActionButton variant='secondary' onClick={onBack}>
                BACK
              </ActionButton>
              <ActionButton variant='primary' onClick={onContinue} disabled={!isValid || isLoadingHubInfo}>
                CONTINUE
              </ActionButton>
            </ButtonRow>
          </ParametersCard>
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

const HubName = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const ParametersCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

const InputWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const InputLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const TokenDropdownContainer = styled(Box)({
  position: "relative",
});

const TokenDropdownButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "transparent",
  border: `1px solid ${canonHeaderTokens.foreground.accent40 || "#37373e"}`,
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
  transition: "border-color 0.2s ease",
  "&:hover": {
    borderColor: canonHeaderTokens.foreground.accent40,
  },
  "&:focus": {
    outline: "none",
    borderColor: canonHeaderTokens.foreground.accent20,
  },
});

const TokenDropdownText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "$hasValue",
})<{ $hasValue: boolean }>(({ $hasValue }) => ({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: $hasValue ? canonHeaderTokens.foreground.accent0 : canonHeaderTokens.foreground.accent30,
  fontFamily: "monospace",
}));

const TokenDropdownMenu = styled(Box)({
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  backgroundColor: canonHeaderTokens.background.layer1,
  border: `1px solid ${canonHeaderTokens.foreground.accent50}`,
  borderRadius: "8px",
  overflow: "hidden",
  zIndex: 100,
  maxHeight: "200px",
  overflowY: "auto",
});

const TokenDropdownItem = styled("button", {
  shouldForwardProp: (prop) => prop !== "$isSelected",
})<{ $isSelected: boolean }>(({ $isSelected }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "4px",
  width: "100%",
  padding: "12px 16px",
  backgroundColor: $isSelected ? canonHeaderTokens.background.layer1Variation : "transparent",
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.15s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
}));

const TokenAddress = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  fontFamily: "monospace",
});

const TokenCapInfo = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ReadOnlyInput = styled(Box)({
  padding: "12px 16px",
  backgroundColor: "transparent",
  border: `1px solid ${canonHeaderTokens.foreground.accent40 || "#37373e"}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  fontFamily: "monospace",
  wordBreak: "break-all",
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
});

const InputHint = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
  fontStyle: "italic",
});

const CapRemainingInfo = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  fontStyle: "italic",
  marginTop: "-4px",
});

const LoadingState = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "24px",
});

const LoadingText = styled(Typography)({
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent20,
});

const ErrorState = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
});

const ErrorText = styled(Typography)({
  fontSize: "14px",
  color: canonHeaderTokens.status.red,
});
