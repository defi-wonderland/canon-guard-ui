import type { ReactNode } from "react";
import { Box, Typography, styled, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { ChevronDownIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface SelectOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface FormInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  type?: "text" | "number" | "select";
  selectOptions?: SelectOption[];
  badge?: ReactNode;
  disabled?: boolean;
  error?: string;
  warning?: string;
  "data-testid"?: string;
}

export const FormInput = ({
  label,
  placeholder = "",
  value,
  onChange,
  optional = false,
  type = "text",
  selectOptions = [],
  badge,
  disabled = false,
  error,
  warning,
  "data-testid": testId,
}: FormInputProps) => {
  const hasError = Boolean(error);
  const hasWarning = Boolean(warning) && !hasError;

  // Check if any option has an icon - use MUI Select for icon support
  const hasIcons = selectOptions.some((opt) => opt.icon);

  const handleMuiSelectChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const selectedOption = selectOptions.find((opt) => opt.value === value);

  return (
    <InputWrapper>
      <LabelRow>
        <Label>{label}</Label>
        {optional && <OptionalLabel>(Optional)</OptionalLabel>}
        {badge}
      </LabelRow>
      <InputContainer hasError={hasError} hasWarning={hasWarning}>
        {type === "select" && hasIcons && (
          <MuiSelectWrapper>
            <StyledMuiSelect
              value={value}
              onChange={handleMuiSelectChange}
              disabled={disabled}
              data-testid={testId}
              displayEmpty
              renderValue={() => (
                <SelectedValueWrapper>
                  {selectedOption?.icon}
                  <span>{selectedOption?.label || "Select"}</span>
                </SelectedValueWrapper>
              )}
              IconComponent={() => (
                <ChevronWrapper>
                  <ChevronDownIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                </ChevronWrapper>
              )}
              MenuProps={{
                disableScrollLock: true,
                sx: {
                  "& .MuiBackdrop-root": {
                    opacity: "0 !important",
                  },
                },
                BackdropProps: {
                  invisible: true,
                },
                PaperProps: {
                  sx: {
                    backgroundColor: canonHeaderTokens.background.layer1,
                    border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
                    borderRadius: "8px",
                    marginTop: "4px",
                    "& .MuiList-root": {
                      padding: "4px",
                    },
                  },
                },
              }}
            >
              {selectOptions.map((option) => (
                <StyledMenuItem key={option.value} value={option.value}>
                  {option.icon}
                  <span>{option.label}</span>
                </StyledMenuItem>
              ))}
            </StyledMuiSelect>
          </MuiSelectWrapper>
        )}

        {type === "select" && !hasIcons && (
          <SelectWrapper>
            <StyledNativeSelect
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              data-testid={testId}
            >
              <option value='' disabled>
                Select
              </option>
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </StyledNativeSelect>
            <ChevronWrapper>
              <ChevronDownIcon size={14} color={canonHeaderTokens.foreground.accent10} />
            </ChevronWrapper>
          </SelectWrapper>
        )}

        {type !== "select" && (
          <StyledInput
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            type={type}
            disabled={disabled}
            data-testid={testId}
          />
        )}
      </InputContainer>
      {hasError && <ErrorMessage>{error}</ErrorMessage>}
      {hasWarning && <WarningMessage>{warning}</WarningMessage>}
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

const OptionalLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
});

const InputContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasError" && prop !== "hasWarning",
})<{ hasError?: boolean; hasWarning?: boolean }>(({ hasError, hasWarning }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  borderRadius: "8px",
  border: `1px solid ${
    hasError
      ? canonHeaderTokens.status.red
      : hasWarning
        ? canonHeaderTokens.amber.border
        : canonHeaderTokens.foreground.accent40 || "#37373e"
  }`,
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
  transition: "border-color 0.2s ease",
}));

const StyledInput = styled("input")({
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
  width: "100%",
  padding: 0,
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent20,
    opacity: 1,
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.5,
  },
});

const SelectWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

const StyledNativeSelect = styled("select")({
  flex: 1,
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: "transparent",
  border: "none",
  outline: "none",
  appearance: "none",
  cursor: "pointer",
  "& option": {
    backgroundColor: canonHeaderTokens.background.layer1,
    color: canonHeaderTokens.foreground.accent0,
  },
});

const MuiSelectWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  width: "100%",
});

const StyledMuiSelect = styled(Select<string>)({
  flex: 1,
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: "transparent",
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiSelect-select": {
    padding: 0,
    paddingRight: "24px !important",
  },
});

const SelectedValueWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const StyledMenuItem = styled(MenuItem)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px",
  borderRadius: "4px",
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent0,
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
  "&.Mui-selected": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
    "&:hover": {
      backgroundColor: canonHeaderTokens.background.layer1Variation,
    },
  },
});

const ChevronWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  pointerEvents: "none",
});

const ErrorMessage = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
  marginTop: "-4px",
});

const WarningMessage = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.amber.text,
  marginTop: "-4px",
});
