import { useCallback } from "react";
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
    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        {data.transfers.map((t, i) => {
          const tokenMeta = findTokenByAddress(t.token, chainId ?? 1);
          return (
            <ParamCard key={i}>
              {data.transfers!.length > 1 && <ParamCardLabel>Transfer {i + 1}</ParamCardLabel>}
              <ParamRow>
                <ParamLabel>Token</ParamLabel>
                <ParamValueRow>
                  <TokenIcon logoURI={tokenMeta?.logoURI} symbol={t.symbol} size={16} />
                  <ParamValue>{t.symbol}</ParamValue>
                  <AddressChip>
                    <CopyableText text={t.token} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                      <ChipText>{truncateAddress(t.token)}</ChipText>
                    </CopyableText>
                    <ExplorerButton onClick={() => openExplorer(t.token)}>
                      <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                    </ExplorerButton>
                  </AddressChip>
                </ParamValueRow>
              </ParamRow>
              <ParamDivider />
              <ParamRow>
                <ParamLabel>Recipient</ParamLabel>
                <ParamValueRow>
                  <CopyableText text={t.recipient} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                    <AddressValue>{truncateAddress(t.recipient)}</AddressValue>
                  </CopyableText>
                  <ExplorerButton onClick={() => openExplorer(t.recipient)}>
                    <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                  </ExplorerButton>
                </ParamValueRow>
              </ParamRow>
              <ParamDivider />
              <ParamRow>
                <ParamLabel>Amount</ParamLabel>
                <ParamValue>
                  {formatUnits(t.amount, t.decimals)} {t.symbol}
                </ParamValue>
              </ParamRow>
            </ParamCard>
          );
        })}
      </Container>
    );
  }

  // ---- Arbitrary Actions ----
  if (data.arbitraryActions && data.arbitraryActions.length > 0) {
    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        {data.arbitraryActions.map((a, i) => (
          <ParamCard key={i}>
            {data.arbitraryActions!.length > 1 && <ParamCardLabel>Action {i + 1}</ParamCardLabel>}
            <ParamRow>
              <ParamLabel>Target</ParamLabel>
              <ParamValueRow>
                <CopyableText text={a.target} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                  <AddressValue>{truncateAddress(a.target)}</AddressValue>
                </CopyableText>
                <ExplorerButton onClick={() => openExplorer(a.target)}>
                  <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                </ExplorerButton>
              </ParamValueRow>
            </ParamRow>
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
        ))}
      </Container>
    );
  }

  // ---- Allowance Claim ----
  if (data.allowanceClaim) {
    const ac = data.allowanceClaim;
    const tokenMeta = findTokenByAddress(ac.token, chainId ?? 1);
    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        <ParamCard>
          <ParamRow>
            <ParamLabel>Token</ParamLabel>
            <ParamValueRow>
              <TokenIcon logoURI={tokenMeta?.logoURI} symbol={ac.symbol} size={16} />
              <ParamValue>{ac.symbol}</ParamValue>
              <AddressChip>
                <CopyableText text={ac.token} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                  <ChipText>{truncateAddress(ac.token)}</ChipText>
                </CopyableText>
                <ExplorerButton onClick={() => openExplorer(ac.token)}>
                  <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                </ExplorerButton>
              </AddressChip>
            </ParamValueRow>
          </ParamRow>
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Token Owner</ParamLabel>
            <ParamValueRow>
              <CopyableText text={ac.tokenOwner} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressValue>{truncateAddress(ac.tokenOwner)}</AddressValue>
              </CopyableText>
              <ExplorerButton onClick={() => openExplorer(ac.tokenOwner)}>
                <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
              </ExplorerButton>
            </ParamValueRow>
          </ParamRow>
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Token Recipient</ParamLabel>
            <ParamValueRow>
              <CopyableText text={ac.tokenRecipient} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressValue>{truncateAddress(ac.tokenRecipient)}</AddressValue>
              </CopyableText>
              <ExplorerButton onClick={() => openExplorer(ac.tokenRecipient)}>
                <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
              </ExplorerButton>
            </ParamValueRow>
          </ParamRow>
        </ParamCard>
      </Container>
    );
  }

  // ---- Capped Transfer (child) ----
  if (data.cappedTransfer) {
    const ct = data.cappedTransfer;
    const tokenMeta = findTokenByAddress(ct.token, chainId ?? 1);
    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        <ParamCard>
          <ParamRow>
            <ParamLabel>Token</ParamLabel>
            <ParamValueRow>
              <TokenIcon logoURI={tokenMeta?.logoURI} symbol={ct.symbol} size={16} />
              <ParamValue>{ct.symbol}</ParamValue>
              <AddressChip>
                <CopyableText text={ct.token} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                  <ChipText>{truncateAddress(ct.token)}</ChipText>
                </CopyableText>
                <ExplorerButton onClick={() => openExplorer(ct.token)}>
                  <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                </ExplorerButton>
              </AddressChip>
            </ParamValueRow>
          </ParamRow>
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Recipient</ParamLabel>
            <ParamValueRow>
              <CopyableText text={ct.recipient} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressValue>{truncateAddress(ct.recipient)}</AddressValue>
              </CopyableText>
              <ExplorerButton onClick={() => openExplorer(ct.recipient)}>
                <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
              </ExplorerButton>
            </ParamValueRow>
          </ParamRow>
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Amount</ParamLabel>
            <ParamValue>
              {ct.formattedAmount} {ct.symbol}
            </ParamValue>
          </ParamRow>
        </ParamCard>
      </Container>
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

    return (
      <Container>
        <SectionLabel>HUB CONFIGURATION</SectionLabel>
        <ParamCard>
          <ParamRow>
            <ParamLabel>Recipient</ParamLabel>
            <ParamValueRow>
              <CopyableText text={hc.recipient} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressValue>{truncateAddress(hc.recipient)}</AddressValue>
              </CopyableText>
              <ExplorerButton onClick={() => openExplorer(hc.recipient)}>
                <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
              </ExplorerButton>
            </ParamValueRow>
          </ParamRow>
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Epoch Length</ParamLabel>
            <ParamValue>{epochDisplay}</ParamValue>
          </ParamRow>
        </ParamCard>

        {hc.tokens.map((t, i) => {
          const tokenMeta = findTokenByAddress(t.token, chainId ?? 1);
          return (
            <ParamCard key={i}>
              <ParamRow>
                <TokenIcon logoURI={tokenMeta?.logoURI} symbol={t.symbol} size={18} />
                <ParamValue style={{ fontWeight: 600 }}>{t.symbol}</ParamValue>
                <AddressChip>
                  <CopyableText text={t.token} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                    <ChipText>{truncateAddress(t.token)}</ChipText>
                  </CopyableText>
                  <ExplorerButton onClick={() => openExplorer(t.token)}>
                    <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                  </ExplorerButton>
                </AddressChip>
              </ParamRow>
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
          );
        })}
      </Container>
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

    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        <ParamCard>
          <ParamRow>
            <ParamLabel>Action Builder</ParamLabel>
            <ParamValueRow>
              <CopyableText text={pa.actionsBuilder} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressValue>{truncateAddress(pa.actionsBuilder)}</AddressValue>
              </CopyableText>
              <ExplorerButton onClick={() => openExplorer(pa.actionsBuilder)}>
                <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
              </ExplorerButton>
            </ParamValueRow>
          </ParamRow>
          <ParamDivider />
          <ParamRow>
            <ParamLabel>Approval Duration</ParamLabel>
            <ParamValue>{durationDisplay}</ParamValue>
          </ParamRow>
        </ParamCard>
      </Container>
    );
  }

  // ---- Change Safe Guard ----
  if (data.changeSafeGuard) {
    const csg = data.changeSafeGuard;
    const isRemove = csg.safeGuard === zeroAddress;

    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        <ParamCard>
          <ParamRow>
            <ParamLabel>Action</ParamLabel>
            <ParamValue>{isRemove ? "Remove Guard" : "Set Guard"}</ParamValue>
          </ParamRow>
          {!isRemove && (
            <>
              <ParamDivider />
              <ParamRow>
                <ParamLabel>Guard Address</ParamLabel>
                <ParamValueRow>
                  <CopyableText text={csg.safeGuard} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                    <AddressValue>{truncateAddress(csg.safeGuard)}</AddressValue>
                  </CopyableText>
                  <ExplorerButton onClick={() => openExplorer(csg.safeGuard)}>
                    <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
                  </ExplorerButton>
                </ParamValueRow>
              </ParamRow>
            </>
          )}
        </ParamCard>
      </Container>
    );
  }

  // ---- Emergency Caller / Trigger ----
  if (data.emergencyAddress) {
    const ea = data.emergencyAddress;
    const roleLabel = ea.role === "caller" ? "Emergency Caller" : "Emergency Trigger";

    return (
      <Container>
        <SectionLabel>ACTION PARAMETERS</SectionLabel>
        <ParamCard>
          <ParamRow>
            <ParamLabel>{roleLabel}</ParamLabel>
            <ParamValueRow>
              <CopyableText text={ea.address} iconSize={9} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressValue>{truncateAddress(ea.address)}</AddressValue>
              </CopyableText>
              <ExplorerButton onClick={() => openExplorer(ea.address)}>
                <ExternalLinkIcon size={9} color={canonHeaderTokens.foreground.accent20} />
              </ExplorerButton>
            </ParamValueRow>
          </ParamRow>
        </ParamCard>
      </Container>
    );
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
