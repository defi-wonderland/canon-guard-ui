import { styled, Box, Card, Typography, Chip, alpha } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";

// Layout Components - Modern and clean
export const SafePageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "100vh",
  overflow: "hidden",
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.secondary,
}));

export const SafeMainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "sidebarCollapsed",
})<{ sidebarCollapsed?: boolean }>(({ theme, sidebarCollapsed }) => ({
  flexGrow: 1,
  width: "100%",
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.secondary,
  overflow: "auto",
  transition: safeDesignTokens.components.sidebar.transition,
  marginLeft: 0,
  // Adaptive spacing based on sidebar state
  [theme.breakpoints.up("md")]: {
    marginLeft: 0,
    paddingLeft: sidebarCollapsed ? safeDesignTokens.sizes.sidebar.collapsed : safeDesignTokens.sizes.sidebar.expanded,
  },
}));

// Card Components - Modern minimal design
export const SafeActionCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isPreApproved",
})<{ isPreApproved?: boolean }>(({ theme, isPreApproved = false }) => {
  const borderColor = isPreApproved
    ? safeDesignTokens[theme.palette.mode].actionStatus.preApproved.main
    : safeDesignTokens[theme.palette.mode].actionStatus.notPreApproved.main;

  return {
    marginBottom: safeDesignTokens.spacing.md,
    border: `${safeDesignTokens.sizes.card.borderWidth} solid ${borderColor}`,
    minHeight: "80px", // Much smaller row-like height instead of 140px
    backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.elevated,
    // Removed hover effects for minimal design
    [theme.breakpoints.down("sm")]: {
      marginBottom: safeDesignTokens.spacing.xs,
      minHeight: "60px", // Even more compact on mobile
    },
  };
});

export const SafeCardContent = styled(Box)(({ theme }) => ({
  padding: `${safeDesignTokens.spacing.md} ${safeDesignTokens.spacing.lg}`, // Reduced vertical padding for row-like layout
  [theme.breakpoints.down("sm")]: {
    padding: `${safeDesignTokens.spacing.sm} ${safeDesignTokens.spacing.md}`, // Much more compact on mobile
  },
}));

// Typography Components
export const SafeCardTitle = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.cardTitle,
  color: theme.palette.text.primary,
  fontSize: "1.125rem",
  fontWeight: 600,
  lineHeight: 1.4,
  marginBottom: safeDesignTokens.spacing.xs,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
  },
}));

export const SafeCardBody = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.cardBody,
  color: theme.palette.text.secondary,
}));

// Status Components
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
    "& .MuiChip-label": {
      fontWeight: safeDesignTokens.components.chip.fontWeight,
    },
  };
});

// Address Component - Modern minimal approach
export const SafeAddress = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  fontSize: "0.875rem",
  color: theme.palette.text.secondary,
  cursor: "pointer",
  padding: `${safeDesignTokens.spacing.xs} ${safeDesignTokens.spacing.sm}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  borderRadius: safeDesignTokens.spacing.xs,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
  },
}));
