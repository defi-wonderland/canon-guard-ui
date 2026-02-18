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

// Review Step Components - shared across ReviewDeployStep, HubReviewStep, DeployHubChildReviewStep

export const PreviewCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

export const PreviewHeader = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "16px",
});

export const PreviewTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: canonHeaderTokens.foreground.accent0,
});

export const PreviewRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

export const PreviewInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const PreviewLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

export const PreviewValue = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

export const EditButton = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  cursor: "pointer",
  "&:hover": {
    color: canonHeaderTokens.foreground.accent10,
  },
});

export const ParametersToggle = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "36px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
  cursor: "pointer",
  "&:hover": {
    opacity: 0.9,
  },
});

export const ToggleContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
});

export const ToggleLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

export const ParametersContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
});

export const ParameterRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$noBorder",
})<{ $noBorder?: boolean }>(({ $noBorder }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px 16px 16px 36px",
  borderTop: $noBorder ? "none" : `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
}));

export const ParameterLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

export const ParameterValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  fontFamily: "monospace",
  wordBreak: "break-all",
});

export const DeployOptionsCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

export const CheckboxRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  borderBottom: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

export const CheckboxLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "20px",
});

export const LockedCheckbox = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.brand.green,
  position: "relative",
  "&:hover": {
    "& .check-icon": {
      opacity: 0,
    },
    "& .lock-icon": {
      opacity: 1,
    },
  },
});

export const CheckIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.15s ease",
});

export const LockIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  opacity: 0,
  transition: "opacity 0.15s ease",
});

export const Checkbox = styled(Box)<{ checked: boolean }>(({ checked }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  backgroundColor: checked ? canonHeaderTokens.brand.green : "transparent",
  border: checked ? "none" : `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    opacity: 0.9,
  },
}));

export const CheckboxLabel = styled(Typography)({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

export const RightContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const SlowPathTag = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const SlowPathLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: canonHeaderTokens.status.red,
});

export const PathTag = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const PathLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: $isFastPath ? canonHeaderTokens.brand.green : canonHeaderTokens.status.red,
}));

export const InfoIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const DurationInputSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px",
  paddingLeft: "64px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

export const DurationLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

export const DurationError = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "4px",
});

export const ErrorText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
});
