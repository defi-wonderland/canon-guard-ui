import type { ReactNode } from "react";
import { Box, styled } from "@mui/material";
import { XIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

export const ModalOverlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
});

export const ModalContainer = styled(Box)({
  width: "420px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.3), 0px 8px 10px -6px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
});

export const ModalHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 12px 24px",
});

export const ModalHeaderLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

export const ModalIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const ModalTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
});

export const ModalCloseButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

export const ModalDescription = styled("p")({
  margin: 0,
  padding: "0 24px 20px 24px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

export const ModalButtonRow = styled(Box)({
  display: "flex",
  gap: "12px",
  padding: "0 24px 24px 24px",
});

export const ModalCancelButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: "transparent",
  color: canonHeaderTokens.foreground.accent10,
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: disabled ? "transparent" : canonHeaderTokens.background.layer1Variation,
  },
}));

export const ModalSubmitButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  transition: "opacity 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    opacity: disabled ? 0.6 : 0.9,
  },
}));

export const ModalErrorText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
});

export const ModalInputLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

export const ModalInputSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "0 24px 24px 24px",
});

interface ModalHeaderWithCloseProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
}

export const ModalHeaderWithClose = ({ title, icon, onClose }: ModalHeaderWithCloseProps) => (
  <ModalHeader>
    <ModalHeaderLeft>
      {icon && <ModalIconWrapper>{icon}</ModalIconWrapper>}
      <ModalTitle>{title}</ModalTitle>
    </ModalHeaderLeft>
    <ModalCloseButton onClick={onClose}>
      <XIcon size={18} color={canonHeaderTokens.foreground.accent20} />
    </ModalCloseButton>
  </ModalHeader>
);
