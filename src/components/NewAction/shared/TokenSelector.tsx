import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Box, CircularProgress, TextField, Typography, styled } from "@mui/material";
import { isAddress } from "viem";
import { TokenIcon } from "~/components/icons";
import { DEFAULT_CHAIN_ID } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useStateContext } from "~/hooks/useStateContext";
import { useTokenLookup } from "~/hooks/useTokenLookup";
import type { TokenInfo } from "~/types/token";

interface TokenSelectorProps {
  label: string;
  value: string;
  onChange: (address: string) => void;
  error?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

/**
 * Token selector component with searchable dropdown.
 * Users can type a token symbol to filter or paste a contract address.
 * Unknown addresses trigger an onchain lookup for symbol/decimals.
 */
export const TokenSelector = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
  "data-testid": testId,
}: TokenSelectorProps) => {
  const { chainId } = useStateContext();
  const resolvedChainId = chainId ?? DEFAULT_CHAIN_ID;
  const { getTokensForChain, findToken, lookupToken } = useTokenLookup(resolvedChainId);

  const [inputValue, setInputValue] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokens = useMemo(() => getTokensForChain(), [getTokensForChain]);

  // Resolve value (address) to the selected token object
  const selectedToken = useMemo(() => {
    if (!value) return null;
    return findToken(value) ?? null;
  }, [value, findToken]);

  // Sync input text when the external value changes (e.g. form reset)
  useEffect(() => {
    if (selectedToken) {
      setInputValue(selectedToken.symbol);
    } else if (value) {
      setInputValue(value);
    } else {
      setInputValue("");
    }
  }, [selectedToken, value]);

  // Filter tokens based on input text
  const filteredTokens = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return tokens;

    // If input looks like an address, filter by address prefix
    if (query.startsWith("0x")) {
      return tokens.filter((t) => t.address.toLowerCase().startsWith(query));
    }

    // Otherwise filter by symbol or name
    return tokens.filter((t) => t.symbol.toLowerCase().includes(query) || t.name.toLowerCase().includes(query));
  }, [tokens, inputValue]);

  // Handle pasted address that's not in the static list
  const handleAddressLookup = useCallback(
    async (address: string) => {
      if (!isAddress(address)) return;

      // Already known?
      const existing = findToken(address);
      if (existing) {
        onChange(existing.address);
        return;
      }

      setIsLookingUp(true);
      setLookupError(null);

      const result = await lookupToken(address);

      setIsLookingUp(false);

      if (result.token) {
        onChange(result.token.address);
      } else if (result.error) {
        setLookupError(result.error);
      }
    },
    [findToken, lookupToken, onChange],
  );

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setInputValue(newInputValue);
      setLookupError(null);

      // Debounce address lookup when user pastes a full address
      if (lookupTimeout.current) {
        clearTimeout(lookupTimeout.current);
      }

      if (isAddress(newInputValue)) {
        lookupTimeout.current = setTimeout(() => {
          handleAddressLookup(newInputValue);
        }, 300);
      }
    },
    [handleAddressLookup],
  );

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string | TokenInfo | null) => {
      if (!newValue) {
        onChange("");
      } else if (typeof newValue === "string") {
        // freeSolo: user pressed enter with a typed string
        if (isAddress(newValue)) {
          handleAddressLookup(newValue);
        }
      } else {
        onChange(newValue.address);
      }
    },
    [onChange, handleAddressLookup],
  );

  const hasError = Boolean(error) || Boolean(lookupError);
  const displayError = error || lookupError;

  // Determine the "no options" message
  const noOptionsText = useMemo(() => {
    const query = inputValue.trim();
    if (!query) return "Start typing a token symbol or paste an address";
    if (isLookingUp) return "Looking up token...";
    if (query.startsWith("0x") && query.length < 42) return "Paste the full token contract address";
    if (query.startsWith("0x")) return "Token not found. Verifying on-chain...";
    return "Token not found. Paste the token contract address to add it.";
  }, [inputValue, isLookingUp]);

  return (
    <InputWrapper>
      <LabelRow>
        <Label>{label}</Label>
      </LabelRow>
      <Autocomplete<TokenInfo, false, false, true>
        freeSolo
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={filteredTokens}
        value={selectedToken}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          return option.symbol;
        }}
        isOptionEqualToValue={(option, val) => option.address.toLowerCase() === val.address.toLowerCase()}
        filterOptions={(x) => x} // We handle filtering ourselves
        noOptionsText={noOptionsText}
        disabled={disabled}
        clearOnBlur={false}
        handleHomeEndKeys={false}
        onBlur={() => {
          // If user typed/pasted an address directly without selecting, keep it as the value
          const trimmed = inputValue.trim();
          if (trimmed && isAddress(trimmed) && trimmed.toLowerCase() !== value.toLowerCase()) {
            handleAddressLookup(trimmed);
          }
        }}
        renderOption={(props, option) => {
          // Extract key from props and pass rest to li
          const { key, ...rest } = props;
          return (
            <OptionItem key={key} {...rest}>
              <TokenIcon logoURI={option.logoURI} symbol={option.symbol} size={20} />
              <OptionText>
                <OptionSymbol>{option.symbol}</OptionSymbol>
                <OptionName>{option.name}</OptionName>
              </OptionText>
            </OptionItem>
          );
        }}
        renderInput={(params) => (
          <InputContainer hasError={hasError}>
            <StyledTextField
              {...params}
              placeholder='Search token or paste address...'
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLookingUp && (
                        <CircularProgress size={16} sx={{ color: canonHeaderTokens.foreground.accent20 }} />
                      )}
                      {selectedToken && !isLookingUp && (
                        <TruncatedAddress>
                          {selectedToken.address.slice(0, 6)}...{selectedToken.address.slice(-4)}
                        </TruncatedAddress>
                      )}
                    </>
                  ),
                  startAdornment: selectedToken ? (
                    <SelectedTokenIcon>
                      <TokenIcon logoURI={selectedToken.logoURI} symbol={selectedToken.symbol} size={20} />
                    </SelectedTokenIcon>
                  ) : undefined,
                },
                htmlInput: {
                  ...params.inputProps,
                  "data-testid": testId,
                },
              }}
            />
          </InputContainer>
        )}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: canonHeaderTokens.background.layer1,
              border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
              borderRadius: "8px",
              marginTop: "4px",
              "& .MuiAutocomplete-listbox": {
                padding: "4px",
                maxHeight: "240px",
              },
              "& .MuiAutocomplete-noOptions": {
                color: canonHeaderTokens.foreground.accent20,
                fontSize: "13px",
                padding: "12px 16px",
              },
            },
          },
          popper: {
            sx: {
              "& .MuiAutocomplete-paper": {
                boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.3)",
              },
            },
          },
        }}
      />
      {hasError && <ErrorMessage>{displayError}</ErrorMessage>}
    </InputWrapper>
  );
};

const InputWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
});

const LabelRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const Label = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const InputContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasError",
})<{ hasError?: boolean }>(({ hasError }) => ({
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: "8px",
  border: `1px solid ${hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent40 || "#37373e"}`,
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
  transition: "border-color 0.2s ease",
}));

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    padding: "8px 12px !important",
    backgroundColor: "transparent",
    "& fieldset": {
      border: "none",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "24px",
    color: canonHeaderTokens.foreground.accent0,
    backgroundColor: "transparent",
    padding: "0 !important",
    "&::placeholder": {
      color: canonHeaderTokens.foreground.accent20,
      opacity: 1,
    },
  },
});

const SelectedTokenIcon = styled(Box)({
  display: "flex",
  alignItems: "center",
  marginRight: "8px",
});

const OptionItem = styled("li")({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px !important",
  borderRadius: "4px",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.background.layer1Variation} !important`,
  },
  "&.Mui-focused": {
    backgroundColor: `${canonHeaderTokens.background.layer1Variation} !important`,
  },
  '&[aria-selected="true"]': {
    backgroundColor: `${canonHeaderTokens.background.layer1Variation} !important`,
  },
});

const OptionText = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
});

const OptionSymbol = styled(Typography)({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  whiteSpace: "nowrap",
});

const OptionName = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const TruncatedAddress = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  whiteSpace: "nowrap",
  fontFamily: "monospace",
});

const ErrorMessage = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
  marginTop: "-4px",
});
