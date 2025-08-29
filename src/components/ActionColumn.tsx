import React from "react";
import { Box, Typography, styled } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { QueuedTransaction } from "~/types/canon-guard";
import { ActionCard } from "./ActionCard";

interface ActionColumnProps {
  icon: React.ReactNode;
  title: string;
  actions: QueuedTransaction[];
  emptyMessage: string;
  showApprovalInfo?: boolean;
}

export const ActionColumn = ({ icon, title, actions, emptyMessage, showApprovalInfo = false }: ActionColumnProps) => {
  const hasActions = actions.length > 0;

  return (
    <ColumnContainer>
      <ColumnHeader>
        {icon}
        <ColumnTitle variant='h6'>{title}</ColumnTitle>
        {hasActions && <ActionCount variant='body2'>({actions.length})</ActionCount>}
      </ColumnHeader>

      {/* Column Content */}
      <ColumnContent>
        {hasActions ? (
          actions.map((action) => (
            <ActionCard key={action.actionBuilder.address} action={action} showApprovalInfo={showApprovalInfo} />
          ))
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
const ColumnContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.elevated,
  border: `1px solid ${safeDesignTokens[theme.palette.mode].borders.secondary}`,
  borderRadius: safeDesignTokens.spacing.sm,
  overflow: "hidden",
}));

const ColumnHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: safeDesignTokens.spacing.sm,
  padding: safeDesignTokens.spacing.lg,
  backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.secondary,
  borderBottom: `1px solid ${safeDesignTokens[theme.palette.mode].borders.secondary}`,
}));

const ColumnTitle = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.cardTitle,
  color: theme.palette.text.primary,
  fontSize: "1rem",
  fontWeight: 600,
  margin: 0,
}));

const ActionCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  fontWeight: 500,
  marginLeft: "auto",
}));

const ColumnContent = styled(Box)(() => ({
  flex: 1,
  padding: safeDesignTokens.spacing.md,
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
  gap: safeDesignTokens.spacing.sm,
}));

const ColumnEmptyState = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "200px",
  flex: 1,
}));

const EmptyStateMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontStyle: "italic",
  textAlign: "center",
  fontSize: "0.875rem",
}));
