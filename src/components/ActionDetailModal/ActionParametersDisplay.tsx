import { useCallback, type ReactNode } from "react";
import { Box, CircularProgress, Typography, styled } from "@mui/material";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { formatUnits, zeroAddress } from "viem";
import { TokenIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { getChainConfig, SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { findTokenByAddress } from "~/constants/tokenList";
import type { ActionParametersData } from "~/hooks/useActionParameters";
import { truncateAddress } from "~/utils/format";

interface ActionParametersDisplayProps {
  data: ActionParametersData | null;
  isLoading: boolean;
  error: string | null;
  chainId: SupportedChainId | null;
}

export const ActionParametersDisplay = ({ data, isLoading, error, chainId }: ActionParametersDisplayProps) => {
  const openExplorer = useCallback(
    (addr: string) => {
      if (!chainId) return;
      const config = getChainConfig(chainId);
      window.open(`${config.blockExplorerUrl}/address/${addr}`, "_blank", "noopener,noreferrer");
    },
    [chainId],
  );

  const renderSection = (label: string, content: ReactNode) => (
    <Container>
      <SectionLabel>{label}</SectionLabel>
      {content}
    </Container>
  );

  const renderAddressValueRow = (address: string) => (
    <ParamValueRow>
      <CopyableText text={address} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
        <AddressValue>{truncateAddress(address)}</AddressValue>
      </CopyableText>
      <ExplorerButton onClick={() => openExplorer(address)}>
        <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
      </ExplorerButton>
    </ParamValueRow>
  );

  const renderAddressRow = (label: string, address: string) => (
    <ParamRow>
      <ParamLabel>{label}</ParamLabel>
      {renderAddressValueRow(address)}
    </ParamRow>
  );

  const renderTokenAddressChip = (address: string) => (
    <AddressChip>
      <CopyableText text={address} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
        <ChipText>{truncateAddress(address)}</ChipText>
      </CopyableText>
      <ExplorerButton onClick={() => openExplorer(address)}>
        <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
      </ExplorerButton>
    </AddressChip>
  );

  const renderTokenRow = ({
    label,
    tokenAddress,
    symbol,
    iconSize = 16,
    emphasizeSymbol = false,
  }: {
    label?: string;
    tokenAddress: string;
    symbol: string;
    iconSize?: number;
    emphasizeSymbol?: boolean;
  }) => {
    const tokenMeta = findTokenByAddress(tokenAddress, chainId ?? 1);
    const symbolStyle = emphasizeSymbol ? { fontWeight: 600 } : undefined;
    const valueRow = (
      <ParamValueRow>
        <TokenIcon logoURI={tokenMeta?.logoURI} symbol={symbol} size={iconSize} />
        <ParamValue style={symbolStyle}>{symbol}</ParamValue>
        {renderTokenAddressChip(tokenAddress)}
      </ParamValueRow>
    );

    if (label) {
      return (
        <ParamRow>
          <ParamLabel>{label}</ParamLabel>
          {valueRow}
        </ParamRow>
      );
    }

    return <ParamRow>{valueRow}</ParamRow>;
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingRow>
          <CircularProgress size={16} sx={{ color: canonHeaderTokens.brand.green }} />
          <LoadingText>Loading action parameters...</LoadingText>
        </LoadingRow>
      </Container>
    );
  }

  if (error || !data) return null;

  // ---- Transfers ----
  if (data.transfers && data.transfers.length > 0) {
    const transfers = data.transfers;
    return renderSection(
      "ACTION PARAMETERS",
      transfers.map((t, i) => (
        <ParamCard key={i}>
          {transfers.length > 1 && <ParamCardLabel>Transfer {i + 1}</ParamCardLabel>}
          {renderTokenRow({ label: "Token", tokenAddress: t.token, symbol: t.symbol })}
          <ParamDivider />
          {renderAddressRow("Recipient", t.recipient)}
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Amount</ParamLabel>
            <ParamValue>
              {formatUnits(t.amount, t.decimals)} {t.symbol}
            </ParamValue>
          </ParamRow>
        </ParamCard>
      )),
    );
  }

  // ---- Arbitrary Actions ----
  if (data.arbitraryActions && data.arbitraryActions.length > 0) {
    const actions = data.arbitraryActions;
    return renderSection(
      "ACTION PARAMETERS",
      actions.map((a, i) => (
        <ParamCard key={i}>
          {actions.length > 1 && <ParamCardLabel>Action {i + 1}</ParamCardLabel>}
          {renderAddressRow("Target", a.target)}
          <ParamDivider />
          {a.signature ? (
            <ParamRow>
              <ParamLabel>Signature</ParamLabel>
              <SignatureValue>{a.signature}</SignatureValue>
            </ParamRow>
          ) : (
            <ParamColumn>
              <ParamLabel>Calldata</ParamLabel>
              <CalldataBox>
                <CalldataText>{a.data}</CalldataText>
              </CalldataBox>
            </ParamColumn>
          )}
          {a.value > 0n && (
            <>
              <ParamDivider />
              <ParamRow>
                <ParamLabel>Value</ParamLabel>
                <ParamValue>{formatUnits(a.value, 18)} ETH</ParamValue>
              </ParamRow>
            </>
          )}
        </ParamCard>
      )),
    );
  }

  // ---- Allowance Claim ----
  if (data.allowanceClaim) {
    const ac = data.allowanceClaim;
    return renderSection(
      "ACTION PARAMETERS",
      <ParamCard>
        {renderTokenRow({ label: "Token", tokenAddress: ac.token, symbol: ac.symbol })}
        <ParamDivider />
        {renderAddressRow("Token Owner", ac.tokenOwner)}
        <ParamDivider />
        {renderAddressRow("Token Recipient", ac.tokenRecipient)}
      </ParamCard>,
    );
  }

  // ---- Capped Transfer (child) ----
  if (data.cappedTransfer) {
    const ct = data.cappedTransfer;
    return renderSection(
      "ACTION PARAMETERS",
      <ParamCard>
        {renderTokenRow({ label: "Token", tokenAddress: ct.token, symbol: ct.symbol })}
        <ParamDivider />
        {renderAddressRow("Recipient", ct.recipient)}
        <ParamDivider />
        <ParamRow>
          <ParamLabel>Amount</ParamLabel>
          <ParamValue>
            {ct.formattedAmount} {ct.symbol}
          </ParamValue>
        </ParamRow>
      </ParamCard>,
    );
  }

  // ---- Hub Config ----
  if (data.hubConfig) {
    const hc = data.hubConfig;
    const epochDays = Number(hc.epochLength) / 86400;
    const epochDisplay =
      epochDays >= 1
        ? `${epochDays} day${epochDays !== 1 ? "s" : ""}`
        : `${Number(hc.epochLength) / 3600} hour${Number(hc.epochLength) / 3600 !== 1 ? "s" : ""}`;

    return renderSection(
      "HUB CONFIGURATION",
      <>
        <ParamCard>
          {renderAddressRow("Recipient", hc.recipient)}
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Epoch Length</ParamLabel>
            <ParamValue>{epochDisplay}</ParamValue>
          </ParamRow>
        </ParamCard>
        {hc.tokens.map((t, i) => (
          <ParamCard key={i}>
            {renderTokenRow({
              tokenAddress: t.token,
              symbol: t.symbol,
              iconSize: 18,
              emphasizeSymbol: true,
            })}
            <ParamDivider />
            <ParamRow>
              <ParamLabel>Cap</ParamLabel>
              <ParamValue>
                {t.formattedCap} {t.symbol}
              </ParamValue>
            </ParamRow>
            <ParamDivider />
            <ParamRow>
              <ParamLabel>Cap Left</ParamLabel>
              <ParamValue>
                {t.formattedCapLeft} {t.symbol}
              </ParamValue>
            </ParamRow>
            <ParamDivider />
            <ParamRow>
              <ParamLabel>Total Spent</ParamLabel>
              <ParamValue>
                {t.formattedTotalSpent} {t.symbol}
              </ParamValue>
            </ParamRow>
          </ParamCard>
        ))}
      </>,
    );
  }

  // ---- Pre-Approve ----
  if (data.preApprove) {
    const pa = data.preApprove;
    const durationSeconds = Number(pa.approvalDuration);
    const durationDays = durationSeconds / 86400;
    const durationDisplay =
      durationDays >= 1
        ? `${durationDays} day${durationDays !== 1 ? "s" : ""}`
        : `${durationSeconds / 3600} hour${durationSeconds / 3600 !== 1 ? "s" : ""}`;

    return renderSection(
      "ACTION PARAMETERS",
      <ParamCard>
        {renderAddressRow("Action Builder", pa.actionsBuilder)}
        <ParamDivider />
        <ParamRow>
          <ParamLabel>Approval Duration</ParamLabel>
          <ParamValue>{durationDisplay}</ParamValue>
        </ParamRow>
      </ParamCard>,
    );
  }

  // ---- Change Safe Guard ----
  if (data.changeSafeGuard) {
    const csg = data.changeSafeGuard;
    const isRemove = csg.safeGuard === zeroAddress;

    return renderSection(
      "ACTION PARAMETERS",
      <ParamCard>
        <ParamRow>
          <ParamLabel>Action</ParamLabel>
          <ParamValue>{isRemove ? "Remove Guard" : "Set Guard"}</ParamValue>
        </ParamRow>
        {!isRemove && (
          <>
            <ParamDivider />
            {renderAddressRow("Guard Address", csg.safeGuard)}
          </>
        )}
      </ParamCard>,
    );
  }

  // ---- Emergency Caller / Trigger ----
  if (data.emergencyAddress) {
    const ea = data.emergencyAddress;
    const roleLabel = ea.role === "caller" ? "Emergency Caller" : "Emergency Trigger";

    return renderSection("ACTION PARAMETERS", <ParamCard>{renderAddressRow(roleLabel, ea.address)}</ParamCard>);
  }

  return null;
};

// ---- Styled Components ----

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const SectionLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  letterSpacing: "0.6px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

const ParamCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  padding: "16px 20px",
});

const ParamCardLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
  marginBottom: "4px",
});

const ParamRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const ParamColumn = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const ParamLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  width: "120px",
  flexShrink: 0,
});

const ParamValue = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const ParamValueRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flex: 1,
  minWidth: 0,
});

const AddressValue = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  cursor: "pointer",
});

const AddressChip = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginLeft: "auto",
  cursor: "pointer",
});

const ChipText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "14px",
  color: canonHeaderTokens.foreground.accent20,
});

const SignatureValue = styled("span")({
  fontFamily: "'Fira Code', 'Courier New', monospace",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  wordBreak: "break-all",
});

const CalldataBox = styled(Box)({
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  padding: "10px 12px",
  maxHeight: "80px",
  overflow: "auto",
});

const CalldataText = styled("span")({
  fontFamily: "'Fira Code', 'Courier New', monospace",
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  wordBreak: "break-all",
});

const ParamDivider = styled(Box)({
  height: "1px",
  width: "100%",
  backgroundColor: canonHeaderTokens.foreground.accent40,
  opacity: 0.5,
});

const LoadingRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 20px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
});

const LoadingText = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
});

const ExplorerButton = styled("button")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  padding: "2px",
  cursor: "pointer",
  opacity: 0.9,
  flexShrink: 0,
  "&:hover": {
    opacity: 1,
  },
});
