import { Box, Tooltip, styled } from "@mui/material";
import {
  SafeActionCard,
  SafeCardContent,
  SafeCardTitle,
  SafeCardBody,
  SafeStatusChip,
  SafeAddress,
} from "~/components/shared/StyledComponents";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { QueuedTransaction } from "~/types/canon-guard";
import { formatTimeRemaining, truncateAddress, formatDate } from "~/utils";

interface ActionCardProps {
  action: QueuedTransaction;
  showApprovalInfo?: boolean;
}

export const ActionCard = ({ action, showApprovalInfo = false }: ActionCardProps) => {
  const copyAddressToClipboard = (address: string) => navigator.clipboard.writeText(address);
  const timeUntilExecutable = Math.max(0, action.executableAt.getTime() - Date.now());
  const isExecutableNow = timeUntilExecutable === 0;

  return (
    <SafeActionCard isPreApproved={action.actionBuilder.isApproved}>
      <SafeCardContent>
        <CardHeaderRow>
          <CardTitleSection>
            <ActionCardTitle>{action.actionBuilder.factoryLabel}</ActionCardTitle>
            {action.actionBuilder.isApproved && <SafeStatusChip label='Pre-Approved' size='small' isPreApproved />}
          </CardTitleSection>

          <CardAddressSection>
            <Tooltip title='Click to copy action builder address'>
              <ActionCardAddress onClick={() => copyAddressToClipboard(action.actionBuilder.actionBuilderAddress)}>
                {truncateAddress(action.actionBuilder.actionBuilderAddress)}
              </ActionCardAddress>
            </Tooltip>
          </CardAddressSection>
        </CardHeaderRow>

        {showApprovalInfo && (
          <InfoRow>
            <ActionCardDetail>State: {action.state}</ActionCardDetail>
            <ActionCardDetail>
              • Approvals: {action.approversCount}/{action.requiredApprovals}
            </ActionCardDetail>
          </InfoRow>
        )}

        <InfoRow>
          <ActionCardDetail>Queued: {formatDate(action.queuedAt)}</ActionCardDetail>
          <ActionCardDetail>
            {isExecutableNow && "• Ready to execute"}
            {!isExecutableNow && `• Executable in: ${formatTimeRemaining(timeUntilExecutable)}`}
          </ActionCardDetail>
        </InfoRow>
      </SafeCardContent>
    </SafeActionCard>
  );
};

const ActionCardTitle = styled(SafeCardTitle)(({ theme }) => ({
  fontSize: "1rem",
  lineHeight: 1.3,
  marginBottom: 0,
  [theme.breakpoints.up("sm")]: {
    fontSize: "1.125rem",
  },
}));

const ActionCardDetail = styled(SafeCardBody)(({ theme }) => ({
  fontSize: "0.75rem",
  [theme.breakpoints.up("sm")]: {
    fontSize: "0.8rem",
  },
}));

const ActionCardAddress = styled(SafeAddress)(() => ({
  wordBreak: "break-all",
  fontSize: "0.8rem",
}));

const CardHeaderRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap: safeDesignTokens.spacing.md,
}));

const CardTitleSection = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: safeDesignTokens.spacing.sm,
  flex: 1,
  minWidth: 0,
}));

const CardAddressSection = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
}));

const InfoRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: safeDesignTokens.spacing.md,
  marginTop: safeDesignTokens.spacing.xs,
  flexWrap: "wrap",
}));
