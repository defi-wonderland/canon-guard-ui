import { Box, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface EmergencyModeBannerProps {
  isActive: boolean;
}

/**
 * Emergency Mode Banner - displays a red banner at the top of the app
 * when emergency mode is active. Should be rendered above the Header
 * in all screens.
 */
export const EmergencyModeBanner = ({ isActive }: EmergencyModeBannerProps) => {
  if (!isActive) return null;

  return (
    <BannerContainer>
      <BannerText>EMERGENCY MODE ACTIVATED</BannerText>
    </BannerContainer>
  );
};

const BannerContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "8px 0",
  backgroundColor: canonHeaderTokens.status.red,
});

const BannerText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "10px",
  fontWeight: 600,
  lineHeight: "12px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#ffffff",
});
