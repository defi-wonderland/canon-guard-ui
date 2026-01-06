import type { ReactNode } from "react";
import { Box, Typography, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface FormCardProps {
  children: ReactNode;
}

export const FormCard = ({ children }: FormCardProps) => {
  return <CardContainer>{children}</CardContainer>;
};

interface FormSectionProps {
  label: string;
  children: ReactNode;
}

export const FormSection = ({ label, children }: FormSectionProps) => {
  return (
    <SectionWrapper>
      <SectionLabelWrapper>
        <SectionLabel>{label}</SectionLabel>
      </SectionLabelWrapper>
      {children}
    </SectionWrapper>
  );
};

interface ButtonRowProps {
  children: ReactNode;
}

export const ButtonRow = ({ children }: ButtonRowProps) => {
  return <ButtonRowContainer>{children}</ButtonRowContainer>;
};

interface ActionButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export const ActionButton = ({ variant, onClick, children, disabled = false }: ActionButtonProps) => {
  return variant === "primary" ? (
    <PrimaryButton onClick={onClick} disabled={disabled}>
      {children}
    </PrimaryButton>
  ) : (
    <SecondaryButton onClick={onClick} disabled={disabled}>
      {children}
    </SecondaryButton>
  );
};

const CardContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
  width: "100%",
});

const SectionWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const SectionLabelWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  padding: "8px",
  width: "100%",
});

const SectionLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

const ButtonRowContainer = styled(Box)({
  display: "flex",
  gap: "16px",
  width: "100%",
  padding: "24px",
  borderTop: `1px dashed ${canonHeaderTokens.background.layer0}`,
});

const buttonBaseStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase" as const,
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover:not(:disabled)": {
    opacity: 0.9,
  },
  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

const PrimaryButton = styled("button")({
  ...buttonBaseStyles,
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  border: "none",
});

const SecondaryButton = styled("button")({
  ...buttonBaseStyles,
  backgroundColor: "transparent",
  color: canonHeaderTokens.foreground.accent10,
  border: `1px solid ${canonHeaderTokens.foreground.accent40 || "#37373e"}`,
});
