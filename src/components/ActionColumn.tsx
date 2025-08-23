import React from "react";
import { Box, Typography, styled } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { SafeAction } from "~/types/safe";
import { ActionCard } from "./ActionCard";

interface ActionColumnProps {
  icon: React.ReactNode;
  title: string;
  actions: SafeAction[];
  emptyMessage: string;
  showApprovalInfo?: boolean;
}

export const ActionColumn = ({ icon, title, actions, emptyMessage, showApprovalInfo = false }: ActionColumnProps) => {
  const hasActions = actions.length > 0;

  return (
    <ColumnContainer>
      {/* Column Header */}
      <ColumnHeader>
        {icon}
        <ColumnHeaderTitle>{title}</ColumnHeaderTitle>
        <ColumnCountBadge>{actions.length}</ColumnCountBadge>
      </ColumnHeader>

      {/* Column Content */}
      <ColumnContent>
        {hasActions ? (
          actions.map((action) => <ActionCard key={action.id} action={action} showApprovalInfo={showApprovalInfo} />)
        ) : (
          <ColumnEmptyState>
            <EmptyStateMessage>{emptyMessage}</EmptyStateMessage>
          </ColumnEmptyState>
        )}
      </ColumnContent>
    </ColumnContainer>
  );
};

// Styled Components
const ColumnContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: safeDesignTokens.spacing.md,
  marginBottom: safeDesignTokens.spacing.lg,
  padding: safeDesignTokens.spacing.md,
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.elevated,
  border: `1px solid ${safeDesignTokens[theme.palette.mode].borders.primary}`,
  [theme.breakpoints.down("sm")]: {
    textAlign: "center",
    justifyContent: "center",
    gap: safeDesignTokens.spacing.sm,
    minHeight: "40px",
  },
}));

const ColumnContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: "auto",
  paddingRight: safeDesignTokens.spacing.sm,
  [theme.breakpoints.down("sm")]: {
    paddingRight: 0,
    height: "auto",
  },
}));

const ColumnEmptyState = styled(Box)(({ theme }) => ({
  padding: safeDesignTokens.spacing.xxl,
  textAlign: "center",
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.elevated,
  border: `2px dashed ${safeDesignTokens[theme.palette.mode].borders.secondary}`,
  borderRadius: safeDesignTokens.sizes.card.borderRadius,
  [theme.breakpoints.down("sm")]: {
    padding: safeDesignTokens.spacing.xl,
  },
}));

const ColumnCountBadge = styled(Box)(({ theme }) => ({
  marginLeft: "auto",
  backgroundColor: safeDesignTokens[theme.palette.mode].brand.primary.main,
  color: safeDesignTokens[theme.palette.mode].brand.primary.contrast,
  padding: `${safeDesignTokens.spacing.sm} ${safeDesignTokens.spacing.md}`,
  minWidth: "32px",
  textAlign: "center",
  [theme.breakpoints.down("sm")]: {
    marginLeft: 0,
    alignSelf: "center",
  },
}));

const ColumnHeaderTitle = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.cardTitle,
  color: theme.palette.text.primary,
  fontWeight: 700,
  textAlign: "center",
  [theme.breakpoints.up("sm")]: {
    textAlign: "left",
  },
}));

const EmptyStateMessage = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.cardBody,
  color: safeDesignTokens[theme.palette.mode].brand.primary.main,
  fontStyle: "italic",
  textAlign: "center",
  padding: safeDesignTokens.spacing.xl,
}));
