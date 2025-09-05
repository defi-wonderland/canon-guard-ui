import { Queue, HourglassEmpty } from "@mui/icons-material";
import { Box, Typography, styled } from "@mui/material";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { CanonVaultData } from "~/types";
import { ActionColumn } from "./ActionColumn";

interface QueueSectionProps {
  canonVaultData: CanonVaultData;
}

export const QueueSection = ({ canonVaultData }: QueueSectionProps) => {
  const waitingForApproval = canonVaultData.queuedTransactions.filter(
    (tx) => tx.safeTxHash && (tx.approversCount || 0) > 0,
  );
  const queuedActions = canonVaultData.queuedTransactions.filter(
    (tx) => !tx.safeTxHash || (tx.approversCount || 0) === 0,
  );
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
          actions={waitingForApproval}
          emptyMessage='No actions waiting for approval'
          showApprovalInfo={true}
        />
      </ColumnsLayout>
    </QueueContentSection>
  );
};

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
