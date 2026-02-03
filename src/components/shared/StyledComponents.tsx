import { styled, Box, Tooltip, tooltipClasses } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import type { TooltipProps } from "@mui/material";

/**
 * Styled tooltip with consistent dark theme styling
 * Use this across the app for all tooltips
 */
export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#37373e",
    color: "#b5b5b7",
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: "20px",
    padding: "12px 16px",
    borderRadius: "6px",
    maxWidth: "347px",
    boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)",
  },
});

// Page container with vertical flex layout (header + content)
export const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

// ============================================
// Setup Flow Layout Components
// ============================================

/**
 * Header bar for setup screens (72px height, layer1 background)
 */
export const SetupHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "72px",
  backgroundColor: canonHeaderTokens.background.layer1,
  width: "100%",
});

/**
 * Centered content area for setup screens
 */
export const SetupContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 24px 64px",
});

/**
 * Form wrapper with max-width constraint (576px)
 */
export const SetupFormWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  maxWidth: "576px",
});

/**
 * Section title for setup screens (uppercase, small text)
 */
export const SetupSectionTitle = styled("h2")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent30,
  padding: "8px",
  margin: 0,
});
