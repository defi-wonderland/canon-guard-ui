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
import { FACTORY_LABELS } from "~/services/canonGuardService";
import { QueuedTransaction } from "~/types/canon-guard";
import { formatTimeRemaining, truncateAddress, formatDate } from "~/utils";

interface ActionCardProps {
  action: QueuedTransaction;
  showApprovalInfo?: boolean;
}

export const ActionCard = ({ action, showApprovalInfo = false }: ActionCardProps) => {
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // Calculate time remaining until executable
  const timeRemainingToExecutable = Math.max(0, action.executableAt.getTime() - Date.now());

  // Get factory label from registry
  const factoryLabel = FACTORY_LABELS[action.actionBuilder.factoryAddress] || "Unknown Factory";

  return (
    <SafeActionCard isPreApproved={action.actionBuilder.isApproved}>
      <SafeCardContent>
        {/* Compact Row Layout */}
        <FlexRowSpaceBetween>
          <FlexLeft>
            <ActionCardTitle>{factoryLabel}</ActionCardTitle>
            {action.actionBuilder.isApproved && (
              <SafeStatusChip label='Pre-Approved' size='small' isPreApproved={true} sx={{ ml: 1 }} />
            )}
          </FlexLeft>

          <FlexRight>
            <Tooltip title='Click to copy address'>
              <ActionCardAddress onClick={() => copyToClipboard(action.actionBuilder.factoryAddress)}>
                {truncateAddress(action.actionBuilder.factoryAddress)}
              </ActionCardAddress>
            </Tooltip>
          </FlexRight>
        </FlexRowSpaceBetween>

        {showApprovalInfo && (
          <InfoRow>
            <ActionCardDetail>State: {action.state}</ActionCardDetail>
            <ActionCardDetail>
              • Approvals: {action.approversCount}/{action.requiredApprovals}
            </ActionCardDetail>
          </InfoRow>
        )}

        {/* Compact Time Information */}
        <InfoRow>
          <ActionCardDetail>Queued: {formatDate(action.queuedAt)}</ActionCardDetail>
          <ActionCardDetail>• Executable in: {formatTimeRemaining(timeRemainingToExecutable)}</ActionCardDetail>
        </InfoRow>
      </SafeCardContent>
    </SafeActionCard>
  );
};

// Styled components for ActionCard-specific patterns
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

// Layout styled components
const FlexRowSpaceBetween = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap: safeDesignTokens.spacing.md,
}));

const FlexLeft = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: safeDesignTokens.spacing.sm,
  flex: 1,
  minWidth: 0,
}));

const FlexRight = styled(Box)(() => ({
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
