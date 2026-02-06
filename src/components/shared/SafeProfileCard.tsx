import { Box, styled } from "@mui/material";
import { ChainIcon, ShieldCheckIcon } from "~/components/icons";
import { getChainConfig, SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { CopyableText } from "./CopyButton";

interface SafeProfileCardProps {
  address: string;
  chainId: number;
}

/**
 * Shared Safe profile card component used across setup screens
 * Shows Safe address with copy functionality and chain name
 */
export const SafeProfileCard = ({ address, chainId }: SafeProfileCardProps) => {
  const chainConfig = getChainConfig(chainId);

  return (
    <CardContainer>
      <CardContent>
        <IconWrapper>
          <ShieldCheckIcon size={16} color={canonHeaderTokens.foreground.accent0} />
        </IconWrapper>
        <Details>
          <AddressRow>
            <Label>Safe</Label>
            <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
              <AddressText>{address}</AddressText>
            </CopyableText>
          </AddressRow>
          <ChainRow>
            <ChainIcon chainId={chainId as SupportedChainId} size={14} />
            <ChainName>{chainConfig?.chain.name || "Unknown Chain"}</ChainName>
          </ChainRow>
        </Details>
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const CardContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
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

const Details = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: 0, // Allow text truncation
});

const AddressRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const Label = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const ChainRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const ChainName = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});
