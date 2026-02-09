/**
 * SafeAccountCard - Displays a saved safe account with chain info and stats
 *
 * Used in the Manage Safe Accounts page to show:
 * - Safe profile (address, chain icon/name)
 * - Chain row with queue count and signers info
 */

import { Box, styled } from "@mui/material";
import { Address } from "viem";
import { ChainIcon, ChevronRightIcon, ShieldCheckIcon, WalletIcon } from "~/components/icons";
import { getChainConfig, SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { truncateAddress } from "~/utils";
import { CopyableText } from "./CopyButton";

export interface SafeAccountCardProps {
  /** Safe wallet address */
  address: Address;
  /** Chain ID */
  chainId: SupportedChainId;
  /** Number of queued transactions (optional) */
  queueCount?: number;
  /** Threshold for Safe (e.g., 2 in 2/3) */
  threshold?: number;
  /** Total number of signers */
  totalSigners?: number;
  /** Whether the connected wallet is a signer of this safe */
  isSigner?: boolean;
  /** Whether this is the currently active safe */
  isCurrentSafe?: boolean;
  /** Click handler for selecting this safe */
  onClick?: () => void;
  /** Whether to show the full card (profile + chain row) or just chain row */
  variant?: "full" | "chain-row";
  /** Test ID for E2E testing */
  testId?: string;
}

/**
 * Full SafeAccountCard with profile and chain info
 */
export const SafeAccountCard = ({
  address,
  chainId,
  queueCount,
  threshold,
  totalSigners,
  isSigner,
  isCurrentSafe = false,
  onClick,
  variant = "full",
  testId,
}: SafeAccountCardProps) => {
  const chainConfig = getChainConfig(chainId);

  if (variant === "chain-row") {
    return (
      <ChainRowContainer onClick={onClick} $clickable={!!onClick} data-testid={testId}>
        <ChainInfo>
          <ChainIcon chainId={chainId} size={14} />
          <ChainName>{chainConfig?.shortName || chainConfig?.name || "Unknown"}</ChainName>
        </ChainInfo>
        <StatsSection>
          {queueCount !== undefined && (
            <StatItem>
              <StatValue>{queueCount}</StatValue>
              <StatLabel>Queue</StatLabel>
            </StatItem>
          )}
          {threshold !== undefined && totalSigners !== undefined && (
            <StatItem>
              <StatValue>
                {threshold}/{totalSigners}
              </StatValue>
              <StatLabel>Signers</StatLabel>
            </StatItem>
          )}
          {onClick && <ChevronRightIcon size={16} color={canonHeaderTokens.foreground.accent30} />}
        </StatsSection>
      </ChainRowContainer>
    );
  }

  return (
    <CardContainer onClick={onClick} $clickable={!!onClick} $isCurrentSafe={isCurrentSafe} data-testid={testId}>
      {/* Profile Section */}
      <ProfileSection>
        <ProfileContent>
          <IconWrapper>
            <ShieldCheckIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          </IconWrapper>
          <ProfileInfo>
            <AddressRow>
              <SafeLabel>Safe</SafeLabel>
              <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
                <AddressText>{truncateAddress(address)}</AddressText>
              </CopyableText>
            </AddressRow>
            <ProfileSubRow>
              <ChainNameSubtle>{chainConfig?.name || "Unknown Chain"}</ChainNameSubtle>
              {isSigner && (
                <SignerBadge>
                  <WalletIcon size={10} />
                  Signer
                </SignerBadge>
              )}
            </ProfileSubRow>
          </ProfileInfo>
        </ProfileContent>
      </ProfileSection>

      {/* Chain Stats Row */}
      <ChainStatsRow>
        <ChainInfo>
          <ChainIcon chainId={chainId} size={14} />
          <ChainName>{chainConfig?.shortName || chainConfig?.name || "Unknown"}</ChainName>
        </ChainInfo>
        <StatsSection>
          {queueCount !== undefined && (
            <StatItem>
              <StatValue>{queueCount}</StatValue>
              <StatLabel>Queue</StatLabel>
            </StatItem>
          )}
          {threshold !== undefined && totalSigners !== undefined && (
            <StatItem>
              <StatValue>
                {threshold}/{totalSigners}
              </StatValue>
              <StatLabel>Signers</StatLabel>
            </StatItem>
          )}
          <ChevronRightIcon size={16} color={canonHeaderTokens.foreground.accent30} />
        </StatsSection>
      </ChainStatsRow>
    </CardContainer>
  );
};

/**
 * Grouped SafeAccountCard - shows a safe with multiple chains
 * Each chain appears as a sub-row
 */
export interface GroupedSafeAccountCardProps {
  /** Safe wallet address */
  address: Address;
  /** Array of chain configurations for this safe */
  chains: Array<{
    chainId: SupportedChainId;
    queueCount?: number;
    threshold?: number;
    totalSigners?: number;
  }>;
  /** Click handler for selecting a specific chain */
  onChainClick?: (chainId: SupportedChainId) => void;
}

export const GroupedSafeAccountCard = ({ address, chains, onChainClick }: GroupedSafeAccountCardProps) => {
  // Use the first chain for the profile display
  const primaryChain = chains[0];
  const chainConfig = getChainConfig(primaryChain?.chainId);

  return (
    <CardContainer $clickable={false} $isCurrentSafe={false}>
      {/* Profile Section */}
      <ProfileSection>
        <ProfileContent>
          <IconWrapper>
            <ShieldCheckIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          </IconWrapper>
          <ProfileInfo>
            <AddressRow>
              <SafeLabel>Safe</SafeLabel>
              <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
                <AddressText>{truncateAddress(address)}</AddressText>
              </CopyableText>
            </AddressRow>
            <ChainNameSubtle>{chainConfig?.name || "Unknown Chain"}</ChainNameSubtle>
          </ProfileInfo>
        </ProfileContent>
      </ProfileSection>

      {/* Chain Rows */}
      {chains.map((chain) => (
        <SafeAccountCard
          key={chain.chainId}
          address={address}
          chainId={chain.chainId}
          queueCount={chain.queueCount}
          threshold={chain.threshold}
          totalSigners={chain.totalSigners}
          variant='chain-row'
          onClick={onChainClick ? () => onChainClick(chain.chainId) : undefined}
        />
      ))}
    </CardContainer>
  );
};

// Styled Components
const CardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$clickable" && prop !== "$isCurrentSafe",
})<{ $clickable: boolean; $isCurrentSafe: boolean }>(({ $clickable }) => ({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
  cursor: $clickable ? "pointer" : "default",
  transition: "background-color 0.2s ease",
  ...($clickable && {
    "&:hover": {
      backgroundColor: canonHeaderTokens.background.layer1Variation,
    },
  }),
}));

const ProfileSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "20px",
});

const ProfileContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const IconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  border: `0.5px solid ${canonHeaderTokens.background.layer1Variation}`,
  flexShrink: 0,
});

const ProfileInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: 0,
});

const AddressRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const SafeLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const ProfileSubRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const ChainNameSubtle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const SignerBadge = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 8px",
  borderRadius: "100px",
  backgroundColor: `${canonHeaderTokens.brand.green}18`,
  color: canonHeaderTokens.brand.green,
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "14px",
  letterSpacing: "0.3px",
});

const ChainStatsRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
  height: "48px",
  boxSizing: "border-box",
});

const ChainRowContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$clickable",
})<{ $clickable: boolean }>(({ $clickable }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
  height: "48px",
  boxSizing: "border-box",
  backgroundColor: canonHeaderTokens.background.layer1,
  cursor: $clickable ? "pointer" : "default",
  transition: "background-color 0.2s ease",
  ...($clickable && {
    "&:hover": {
      backgroundColor: canonHeaderTokens.background.layer1Variation,
    },
  }),
}));

const ChainInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const ChainName = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const StatsSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "24px",
});

const StatItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const StatValue = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const StatLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});
