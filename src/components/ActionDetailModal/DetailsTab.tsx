import { useCallback, useState } from "react";
import { Box, styled } from "@mui/material";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Address } from "viem";
import { BoxIcon, ChevronDownIcon, ChevronUpIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { getChainConfig, SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useActionParameters } from "~/hooks/useActionParameters";
import { getFactoryDisplayName } from "~/utils/factoryDisplay";
import { truncateAddress } from "~/utils/format";
import { ActionParametersDisplay } from "./ActionParametersDisplay";
import type { ActionDetailModalData } from "./index";

interface DetailsTabProps {
  data: ActionDetailModalData;
  chainId: SupportedChainId | null;
}

export const DetailsTab = ({ data, chainId }: DetailsTabProps) => {
  const isQueue = data.mode === "queue";

  const factoryType = isQueue ? data.item.factoryType : data.entity.factoryType;
  const factoryLabel = isQueue ? data.item.factoryLabel : data.entity.factoryLabel;
  const address = (isQueue ? data.item.actionBuilderAddress : data.entity.address) as Address;
  const isHub = !isQueue && data.entity.isHub;

  const factoryDisplayName = getFactoryDisplayName(factoryType);
  const displayFactory = factoryDisplayName !== "Unknown" ? factoryDisplayName : factoryLabel || "Unknown";

  // Fetch decoded action parameters (isHub flag enables hub-specific fetching)
  const {
    data: paramsData,
    isLoading: paramsLoading,
    error: paramsError,
  } = useActionParameters(address, factoryType, isHub);

  // Auto-open technical details when there are no decoded parameters to show
  const hasParams = paramsData !== null && !paramsError;
  const shouldAutoOpen = !paramsLoading && !hasParams;
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const isTechnicalOpen = userToggled ? technicalOpen : technicalOpen || shouldAutoOpen;

  const openExplorer = useCallback(
    (addr: string) => {
      if (!chainId) return;
      const config = getChainConfig(chainId);
      window.open(`${config.blockExplorerUrl}/address/${addr}`, "_blank", "noopener,noreferrer");
    },
    [chainId],
  );

  return (
    <Container>
      {/* Human-readable action parameters */}
      <ActionParametersDisplay data={paramsData} isLoading={paramsLoading} error={paramsError} chainId={chainId} />

      {/* Technical Details - Collapsible (auto-opens when no params available) */}
      <TechnicalSection>
        <TechnicalHeader
          onClick={() => {
            setUserToggled(true);
            setTechnicalOpen(!isTechnicalOpen);
          }}
        >
          <TechnicalLabel>TECHNICAL DETAILS</TechnicalLabel>
          {isTechnicalOpen ? (
            <ChevronUpIcon size={14} color={canonHeaderTokens.foreground.accent30} />
          ) : (
            <ChevronDownIcon size={14} color={canonHeaderTokens.foreground.accent30} />
          )}
        </TechnicalHeader>

        {isTechnicalOpen && (
          <InfoSection>
            <InfoRows>
              {/* Action Builder Address */}
              <InfoRow>
                <InfoLabel>Action Builder</InfoLabel>
                <InfoValueRow>
                  <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent20}>
                    <AddressText>{truncateAddress(address)}</AddressText>
                  </CopyableText>
                  <ExplorerLink onClick={() => openExplorer(address)}>
                    <ExternalLinkIcon size={10} color={canonHeaderTokens.foreground.accent20} />
                  </ExplorerLink>
                </InfoValueRow>
              </InfoRow>
              <InfoDivider />

              {/* Factory Type */}
              <InfoRow>
                <InfoLabel>Canon Factory</InfoLabel>
                <InfoValueRow>
                  <BoxIcon size={14} color={canonHeaderTokens.foreground.accent20} />
                  <FactoryText>{displayFactory.toUpperCase()}</FactoryText>
                </InfoValueRow>
              </InfoRow>
              <InfoDivider />

              {/* Factory Type Key */}
              <InfoRow>
                <InfoLabel>Factory Type</InfoLabel>
                <InfoValue>{factoryType}</InfoValue>
              </InfoRow>

              {/* Queue-specific details */}
              {isQueue && (
                <>
                  <InfoDivider />

                  {/* Proposer */}
                  <InfoRow>
                    <InfoLabel>Proposer</InfoLabel>
                    <InfoValueRow>
                      <CopyableText
                        text={data.item.proposer}
                        iconSize={10}
                        iconColor={canonHeaderTokens.foreground.accent20}
                      >
                        <AddressText>{truncateAddress(data.item.proposer)}</AddressText>
                      </CopyableText>
                      <ExplorerLink onClick={() => openExplorer(data.item.proposer)}>
                        <ExternalLinkIcon size={10} color={canonHeaderTokens.foreground.accent20} />
                      </ExplorerLink>
                    </InfoValueRow>
                  </InfoRow>
                  <InfoDivider />

                  {/* Safe Tx Hash */}
                  <InfoRow>
                    <InfoLabel>Safe Tx Hash</InfoLabel>
                    <InfoValueRow>
                      <CopyableText
                        text={data.item.safeTxHash}
                        iconSize={10}
                        iconColor={canonHeaderTokens.foreground.accent20}
                      >
                        <HashText>{truncateHash(data.item.safeTxHash)}</HashText>
                      </CopyableText>
                    </InfoValueRow>
                  </InfoRow>
                  <InfoDivider />

                  {/* Actions Data */}
                  <InfoColumn>
                    <InfoLabel>Actions Data</InfoLabel>
                    <DataBox>
                      <DataText>{data.item.actionsData}</DataText>
                    </DataBox>
                  </InfoColumn>

                  {/* Hub Info (if applicable) */}
                  {data.item.isHubChild && data.item.hubAddress && (
                    <>
                      <InfoDivider />
                      <InfoRow>
                        <InfoLabel>Hub Address</InfoLabel>
                        <InfoValueRow>
                          <CopyableText
                            text={data.item.hubAddress}
                            iconSize={10}
                            iconColor={canonHeaderTokens.foreground.accent20}
                          >
                            <AddressText>{truncateAddress(data.item.hubAddress)}</AddressText>
                          </CopyableText>
                          <ExplorerLink onClick={() => openExplorer(data.item.hubAddress!)}>
                            <ExternalLinkIcon size={10} color={canonHeaderTokens.foreground.accent20} />
                          </ExplorerLink>
                        </InfoValueRow>
                      </InfoRow>
                      {data.item.hubLabel && (
                        <>
                          <InfoDivider />
                          <InfoRow>
                            <InfoLabel>Hub Label</InfoLabel>
                            <InfoValue>{data.item.hubLabel}</InfoValue>
                          </InfoRow>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </InfoRows>
          </InfoSection>
        )}
      </TechnicalSection>
    </Container>
  );
};

// Helpers
const truncateHash = (hash: string): string => {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

// Styled Components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  borderRadius: "8px",
  overflow: "hidden",
});

const TechnicalSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

const TechnicalHeader = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const TechnicalLabel = styled("span")({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  letterSpacing: "0.6px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

const InfoSection = styled(Box)({
  padding: "0 20px 20px 20px",
});

const InfoRows = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const InfoRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const InfoColumn = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const InfoLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  width: "137px",
  flexShrink: 0,
});

const InfoValue = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  wordBreak: "break-all",
});

const InfoValueRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  flex: 1,
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const HashText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const FactoryText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  textTransform: "uppercase",
});

const InfoDivider = styled(Box)({
  height: "1px",
  width: "100%",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

const DataBox = styled(Box)({
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  padding: "12px",
  maxHeight: "120px",
  overflow: "auto",
});

const DataText = styled("span")({
  fontFamily: "'Fira Code', 'Courier New', monospace",
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  wordBreak: "break-all",
});

const ExplorerLink = styled("button")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  padding: "2px",
  cursor: "pointer",
  opacity: 0.9,
  transition: "opacity 0.15s ease",
  flexShrink: 0,
  "&:hover": {
    opacity: 1,
  },
});
