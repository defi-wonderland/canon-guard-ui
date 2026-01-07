import { Box, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { DurationTimeUnit } from "~/utils/timeUnits";

interface DurationInputProps {
  value: string;
  unit: DurationTimeUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: DurationTimeUnit) => void;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
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
}: DurationInputProps) => {
  return (
    <DurationInputRow className={className}>
      <StyledInput
        type='number'
        min='1'
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        $hasError={hasError}
      />
      <StyledSelect value={unit} onChange={(e) => onUnitChange(e.target.value as DurationTimeUnit)}>
        <option value='seconds'>seconds</option>
        <option value='minutes'>minutes</option>
        <option value='hours'>hours</option>
        <option value='days'>days</option>
        <option value='weeks'>weeks</option>
        <option value='months'>months</option>
      </StyledSelect>
    </DurationInputRow>
  );
};

const DurationInputRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const StyledInput = styled("input")<{ $hasError?: boolean }>(({ $hasError }) => ({
  flex: 1,
  height: "40px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer0,
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

const StyledSelect = styled("select")({
  height: "40px",
  padding: "0 32px 0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: canonHeaderTokens.foreground.accent20,
  },
  "& option": {
    backgroundColor: canonHeaderTokens.background.layer0,
    color: canonHeaderTokens.foreground.accent0,
  },
});
