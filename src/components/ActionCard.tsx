import { OpenInNew } from "@mui/icons-material";
import { Box, Button, Tooltip, styled } from "@mui/material";
import {
  SafeActionCard,
  SafeCardContent,
  SafeCardTitle,
  SafeCardBody,
  SafeStatusChip,
  SafeAddress,
} from "~/components/shared/StyledComponents";
import { safeDesignTokens } from "~/config/themes/safeTheme";
import { SafeAction } from "~/types/safe";
import { formatTimeRemaining, truncateAddress, formatDate } from "~/utils";

interface ActionCardProps {
  action: SafeAction;
  showApprovalInfo?: boolean;
}

export const ActionCard = ({ action, showApprovalInfo = false }: ActionCardProps) => {
  const handleSimulation = () => {
    if (action.tenderlySim) {
      window.open(action.tenderlySim, "_blank");
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <SafeActionCard isPreApproved={action.isPreApproved}>
      <SafeCardContent>
        {/* Compact Row Layout */}
        <FlexRowSpaceBetween>
          <FlexLeft>
            <ActionCardTitle>{action.factoryLabel || "Unknown Factory"}</ActionCardTitle>
            {action.isPreApproved && (
              <SafeStatusChip label='Pre-Approved' size='small' isPreApproved={true} sx={{ ml: 1 }} />
            )}
          </FlexLeft>

          <FlexRight>
            <Tooltip title='Click to copy address'>
              <ActionCardAddress onClick={() => copyToClipboard(action.factoryAddress)}>
                {truncateAddress(action.factoryAddress)}
              </ActionCardAddress>
            </Tooltip>
          </FlexRight>
        </FlexRowSpaceBetween>

        {showApprovalInfo && action.nonce && (
          <InfoRow>
            <ActionCardDetail>Nonce: {action.nonce}</ActionCardDetail>
            {action.approvalsCount !== undefined && action.approvalThreshold && (
              <ActionCardDetail>
                • Approvals: {action.approvalsCount}/{action.approvalThreshold}
              </ActionCardDetail>
            )}
          </InfoRow>
        )}

        {/* Compact Time Information */}
        <InfoRow>
          <ActionCardDetail>Queued: {formatDate(action.queuedAt)}</ActionCardDetail>
          <ActionCardDetail>• Executable in: {formatTimeRemaining(action.timeRemainingToExecutable)}</ActionCardDetail>
        </InfoRow>

        {/* Action Buttons */}
        {action.tenderlySim && (
          <Button variant='contained' size='small' startIcon={<OpenInNew />} onClick={handleSimulation} color='primary'>
            Simulate on Tenderly
          </Button>
        )}
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
