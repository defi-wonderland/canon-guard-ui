import { Queue, HourglassEmpty } from "@mui/icons-material";
import { Box, Typography, styled } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { SafeAction } from "~/types/safe";
import { ActionColumn } from "./ActionColumn";

interface QueueSectionProps {
  queuedActions: SafeAction[];
  waitingForApprovalActions: SafeAction[];
}

export const QueueSection = ({ queuedActions, waitingForApprovalActions }: QueueSectionProps) => {
  return (
    <QueueContentSection>
      <PageTitle>Queue Management</PageTitle>

      <QueueGridContainer>
        <ActionColumn
          icon={<Queue color='primary' />}
          title='On Queue'
          actions={queuedActions}
          emptyMessage='No actions currently in queue'
        />

        <ActionColumn
          icon={<HourglassEmpty color='primary' />}
          title='Waiting for Approval'
          actions={waitingForApprovalActions}
          emptyMessage='No actions waiting for approval'
          showApprovalInfo
        />
      </QueueGridContainer>
    </QueueContentSection>
  );
};

// Styled Components
const QueueContentSection = styled(Box)(({ theme }) => ({
  padding: `${safeDesignTokens.spacing.lg} ${safeDesignTokens.spacing.md}`,
  height: "100%",
  overflow: "auto",
  maxWidth: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: `${safeDesignTokens.spacing.sm} ${safeDesignTokens.spacing.xs}`,
  },
  [theme.breakpoints.up("lg")]: {
    padding: `${safeDesignTokens.spacing.xl} ${safeDesignTokens.spacing.lg}`,
  },
}));

const QueueGridContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: safeDesignTokens.spacing.md,
  height: "calc(100% - 100px)",
  gridTemplateColumns: "1fr",
  [theme.breakpoints.down("sm")]: {
    gap: safeDesignTokens.spacing.sm,
    height: "calc(100% - 80px)",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr",
    gap: safeDesignTokens.spacing.lg,
  },
  [theme.breakpoints.up("lg")]: {
    gap: safeDesignTokens.spacing.xl,
  },
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  ...safeDesignTokens.typography.pageTitle,
  marginBottom: safeDesignTokens.spacing.xl,
  textAlign: "center",
  color: safeDesignTokens[theme.palette.mode].brand.primary.main,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.5rem",
    marginBottom: safeDesignTokens.spacing.md,
  },
}));
