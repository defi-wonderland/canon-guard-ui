import { ReactNode } from "react";
import { Box, styled } from "@mui/material";

interface WarningBannerProps {
  backgroundColor: string;
  children: ReactNode;
  "data-testid"?: string;
}

/**
 * Generic Warning Banner - displays a colored banner at the top of the app.
 * Used for emergency mode and detached mode warnings.
 * Accepts children for flexible content including inline links.
 */
export const WarningBanner = ({ backgroundColor, children, "data-testid": testId }: WarningBannerProps) => {
  return (
    <BannerContainer style={{ backgroundColor }} data-testid={testId}>
      <BannerContent>{children}</BannerContent>
    </BannerContainer>
  );
};

/**
 * Styled link component for use within WarningBanner
 */
export const BannerLink = styled("button")({
  fontFamily: "Inter, sans-serif",
  fontSize: "10px",
  fontWeight: 600,
  lineHeight: "12px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#ffffff",
  background: "none",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
  "&:hover": {
    opacity: 0.8,
  },
});

const BannerContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "8px 16px",
  gap: "6px",
});

const BannerContent = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "10px",
  fontWeight: 600,
  lineHeight: "12px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#ffffff",
  textAlign: "center",
});
