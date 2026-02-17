import { Box, styled, Typography } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

export const FactorySelector = styled(Box)({
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

export const HubSelector = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$interactive",
})<{ $interactive?: boolean }>(({ $interactive = false }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  cursor: $interactive ? "pointer" : "default",
  transition: $interactive ? "opacity 0.2s ease" : undefined,
  ...($interactive
    ? {
        "&:hover": {
          opacity: 0.85,
        },
      }
    : {}),
}));

export const LeftContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const ChangeButton = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

export const TransactionTitleCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
  position: "relative",
});

export const CardContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "24px",
});

export const FormInputWrapper = styled(Box)({
  position: "relative",
});

export const PublicBadge = styled(Box)({
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

export const EncryptionNote = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
});

export const NoteText = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
});

export const LearnMoreLink = styled("span")({
  textDecoration: "underline",
  cursor: "pointer",
});
