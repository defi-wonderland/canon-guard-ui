import { Queue, HourglassEmpty } from "@mui/icons-material";
import { Box, Typography, styled } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { QueuedTransaction } from "~/types/canon-guard";
import { ActionColumn } from "./ActionColumn";

interface QueueSectionProps {
  queuedActions: QueuedTransaction[];
  waitingForApprovalActions: QueuedTransaction[];
}

export const QueueSection = ({ queuedActions, waitingForApprovalActions }: QueueSectionProps) => {
  return (
    <QueueContentSection>
      <PageTitle>Queue Management</PageTitle>
      <ColumnsLayout>
        <ActionColumn
          icon={<Queue />}
          title='Queued Actions'
          actions={queuedActions}
          emptyMessage='No queued actions at the moment'
          showApprovalInfo={false}
        />
        <ActionColumn
          icon={<HourglassEmpty />}
          title='Waiting for Approval'
          actions={waitingForApprovalActions}
          emptyMessage='No actions waiting for approval'
          showApprovalInfo={true}
        />
      </ColumnsLayout>
    </QueueContentSection>
  );
};

// Styled Components
const QueueContentSection = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: safeDesignTokens.spacing.xl,
  padding: safeDesignTokens.spacing.xl,
  maxWidth: "1400px",
  margin: "0 auto",
  width: "100%",
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: "1.75rem",
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: safeDesignTokens.spacing.lg,
  textAlign: "center",
}));

const ColumnsLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: safeDesignTokens.spacing.xl,
  alignItems: "stretch",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: safeDesignTokens.spacing.lg,
  },
}));
