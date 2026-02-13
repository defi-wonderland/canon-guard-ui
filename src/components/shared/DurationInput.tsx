import { Box, MenuItem, Select, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { DurationTimeUnit } from "~/utils/timeUnits";

const ALL_DURATION_UNITS: DurationTimeUnit[] = ["seconds", "minutes", "hours", "days", "weeks", "months"];
const DURATION_SELECT_MENU_PROPS = {
  disableScrollLock: true,
  BackdropProps: {
    sx: {
      backgroundColor: "transparent !important",
      backdropFilter: "none",
    },
  },
  slotProps: {
    root: {
      sx: {
        "& .MuiBackdrop-root": {
          backgroundColor: "transparent !important",
          backdropFilter: "none",
        },
      },
    },
  },
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "left",
  } as const,
  transformOrigin: {
    vertical: "top",
    horizontal: "left",
  } as const,
};

interface DurationInputProps {
  value: string;
  unit: DurationTimeUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: DurationTimeUnit) => void;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
  /** Units to exclude from the dropdown */
  excludeUnits?: DurationTimeUnit[];
  /** Test ID for the input element */
  testId?: string;
}

/**
 * DurationInput - A reusable input for entering time durations
 * Combines a number input with a unit dropdown (seconds, minutes, hours, days, weeks, months)
 */
export const DurationInput = ({
  value,
  unit,
  onValueChange,
  onUnitChange,
  hasError = false,
  placeholder = "Enter duration",
  className,
  excludeUnits = [],
  testId,
}: DurationInputProps) => {
  const availableUnits = ALL_DURATION_UNITS.filter((u) => !excludeUnits.includes(u));

  return (
    <DurationInputRow className={className}>
      <StyledInput
        type='number'
        min='1'
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        $hasError={hasError}
        data-testid={testId ? `${testId}-input` : undefined}
      />
      <StyledSelect
        value={unit}
        onChange={(event) => {
          const value = event.target.value as DurationTimeUnit;
          onUnitChange(value);
        }}
        MenuProps={DURATION_SELECT_MENU_PROPS}
        data-testid={testId ? `${testId}-select` : undefined}
      >
        {availableUnits.map((u) => (
          <StyledMenuItem key={u} value={u}>
            {u}
          </StyledMenuItem>
        ))}
      </StyledSelect>
    </DurationInputRow>
  );
};

const DurationInputRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
});

const StyledInput = styled("input")<{ $hasError?: boolean }>(({ $hasError }) => ({
  flex: 1,
  minWidth: 0,
  height: "40px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer1,
  border: `1px solid ${$hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  outline: "none",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: $hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent20,
  },
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
  // Remove number input spinners
  "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "&[type=number]": {
    MozAppearance: "textfield",
  },
}));

const StyledSelect = styled(Select)({
  minWidth: "136px",
  height: "40px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "6px",
  cursor: "pointer",
  "& .MuiSelect-select": {
    padding: "9px 32px 9px 12px",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "20px",
    color: canonHeaderTokens.foreground.accent0,
    minHeight: "unset",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: canonHeaderTokens.foreground.accent40,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: canonHeaderTokens.foreground.accent30,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: canonHeaderTokens.foreground.accent20,
  },
  "& .MuiSelect-icon": {
    color: canonHeaderTokens.foreground.accent30,
    right: "10px",
  },
  "@media (max-width: 600px)": {
    minWidth: "120px",
  },
});

const StyledMenuItem = styled(MenuItem)({
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer1,
});
