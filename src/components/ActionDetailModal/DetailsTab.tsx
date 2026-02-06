import { Box, styled } from "@mui/material";
import { BoxIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { getFactoryDisplayName } from "~/utils/factoryDisplay";
import { truncateAddress } from "~/utils/format";
import type { ActionDetailModalData } from "./index";

interface DetailsTabProps {
  data: ActionDetailModalData;
}

export const DetailsTab = ({ data }: DetailsTabProps) => {
  const isQueue = data.mode === "queue";

  const factoryType = isQueue ? data.item.factoryType : data.entity.factoryType;
  const factoryLabel = isQueue ? data.item.factoryLabel : data.entity.factoryLabel;
  const address = isQueue ? data.item.actionBuilderAddress : data.entity.address;

  const factoryDisplayName = getFactoryDisplayName(factoryType);
  const displayFactory = factoryDisplayName !== "Unknown" ? factoryDisplayName : factoryLabel || "Unknown";

  return (
    <Container>
      <InfoSection>
        <InfoRows>
          {/* Action Builder Address */}
          <InfoRow>
            <InfoLabel>Action Builder</InfoLabel>
            <InfoValueRow>
              <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent20}>
                <AddressText>{truncateAddress(address)}</AddressText>
              </CopyableText>
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
  borderRadius: "8px",
  overflow: "hidden",
});

const InfoSection = styled(Box)({
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "32px",
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
