import { styled, Box, Card, Typography, Chip, alpha, Tooltip, tooltipClasses } from "@mui/material";
import { safeDesignTokens, canonHeaderTokens } from "~/config/themes/safeTheme";
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

// Main content area below header
export const MainContent = styled(Box)({
  flex: 1,
  overflow: "auto",
  backgroundColor: canonHeaderTokens.background.layer0,
});

// Legacy exports for backwards compatibility (will be removed in future)
export const SafePageContainer = PageContainer;
export const SafeMainContent = MainContent;

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

/**
 * Card container for setup screens
 */
export const SetupCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
});

export const SafeActionCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isPreApproved",
})<{ isPreApproved?: boolean }>(({ theme, isPreApproved = false }) => {
  const borderColor = isPreApproved
    ? safeDesignTokens[theme.palette.mode].actionStatus.preApproved.main
    : safeDesignTokens[theme.palette.mode].actionStatus.notPreApproved.main;

  return {
    marginBottom: safeDesignTokens.spacing.md,
    border: `${safeDesignTokens.sizes.card.borderWidth} solid ${borderColor}`,
    minHeight: "80px",
    backgroundColor: canonHeaderTokens.background.layer1,
    [theme.breakpoints.down("sm")]: {
      marginBottom: safeDesignTokens.spacing.xs,
      minHeight: "60px",
    },
  };
});

export const SafeCardContent = styled(Box)(({ theme }) => ({
  padding: `${safeDesignTokens.spacing.md} ${safeDesignTokens.spacing.lg}`,
  [theme.breakpoints.down("sm")]: {
    padding: `${safeDesignTokens.spacing.sm} ${safeDesignTokens.spacing.md}`,
  },
}));

export const SafeCardTitle = styled(Typography)({
  ...safeDesignTokens.typography.cardTitle,
  color: canonHeaderTokens.foreground.accent0,
  fontSize: "1.125rem",
  fontWeight: 600,
  lineHeight: 1.4,
  marginBottom: safeDesignTokens.spacing.xs,
});

export const SafeCardBody = styled(Typography)({
  ...safeDesignTokens.typography.cardBody,
  color: canonHeaderTokens.foreground.accent10,
});

export const SafeStatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "isPreApproved",
})<{ isPreApproved?: boolean }>(({ theme, isPreApproved = false }) => {
  const colors = isPreApproved
    ? safeDesignTokens[theme.palette.mode].actionStatus.preApproved
    : safeDesignTokens[theme.palette.mode].actionStatus.notPreApproved;

  return {
    ...safeDesignTokens.components.chip,
    backgroundColor: alpha(colors.main, 0.1),
    color: colors.dark,
    border: `1px solid ${alpha(colors.main, 0.3)}`,
    marginLeft: 8,
    "& .MuiChip-label": {
      fontWeight: safeDesignTokens.components.chip.fontWeight,
    },
  };
});

export const SafeAddress = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  fontSize: "0.875rem",
  color: canonHeaderTokens.foreground.accent10,
  cursor: "pointer",
  padding: `${safeDesignTokens.spacing.xs} ${safeDesignTokens.spacing.sm}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  borderRadius: safeDesignTokens.spacing.xs,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: canonHeaderTokens.brand.green,
  },
}));
