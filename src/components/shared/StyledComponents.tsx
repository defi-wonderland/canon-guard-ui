import { styled, Box, Card, Typography, Chip, alpha } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";

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
  [theme.breakpoints.up("md")]: {
    marginLeft: 0,
    paddingLeft: sidebarCollapsed ? safeDesignTokens.sizes.sidebar.collapsed : safeDesignTokens.sizes.sidebar.expanded,
  },
}));

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
    backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.elevated,
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
