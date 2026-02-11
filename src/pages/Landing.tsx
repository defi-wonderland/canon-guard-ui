import { Box, Button, styled, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Footer } from "~/components/Footer";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <LogoContainer>
            <LogoBold>CANON</LogoBold>
            <LogoRegular>GUARD</LogoRegular>
          </LogoContainer>
        </HeaderContent>
      </Header>

      <HeroSection>
        <HeroLine />
        <HeroText>A new way of ownership.</HeroText>
        <ButtonGroup>
          <LaunchButton variant='contained' onClick={() => navigate("/")}>
            LAUNCH APP
          </LaunchButton>
          <DocsButton variant='outlined'>DOCS</DocsButton>
        </ButtonGroup>
      </HeroSection>

      <Footer />
    </PageContainer>
  );
};

const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  height: "100vh",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const Header = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "72px",
  width: "100%",
  flexShrink: 0,
});

const HeaderContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  height: "100%",
});

const LogoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "4px",
  alignItems: "center",
  height: "100%",
  paddingLeft: "28px",
  fontSize: "20px",
  lineHeight: 0,
  color: canonHeaderTokens.foreground.accent0,
  whiteSpace: "nowrap",
  [theme.breakpoints.down("sm")]: {
    paddingLeft: "16px",
    fontSize: "18px",
  },
}));

const LogoBold = styled("span")({
  fontFamily: "GT Walsheim Pro, sans-serif",
  fontWeight: 700,
  fontStyle: "oblique",
  lineHeight: "normal",
});

const LogoRegular = styled("span")({
  fontFamily: "GT Walsheim Pro, sans-serif",
  fontWeight: 400,
  fontStyle: "oblique",
  lineHeight: "normal",
});

const HeroSection = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "32px",
  alignItems: "center",
  paddingLeft: "120px",
  paddingRight: "120px",
  flexShrink: 0,
  [theme.breakpoints.down("lg")]: {
    paddingLeft: "60px",
    paddingRight: "60px",
    gap: "24px",
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    paddingLeft: "32px",
    paddingRight: "32px",
    gap: "24px",
  },
  [theme.breakpoints.down("sm")]: {
    paddingLeft: "16px",
    paddingRight: "16px",
    gap: "16px",
  },
}));

const HeroLine = styled(Box)(({ theme }) => ({
  width: "120px",
  height: "1px",
  backgroundColor: canonHeaderTokens.foreground.accent0,
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    width: "60px",
  },
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const HeroText = styled(Typography)(({ theme }) => ({
  fontSize: "28px",
  fontWeight: 200,
  fontStyle: "italic",
  lineHeight: "normal",
  color: canonHeaderTokens.foreground.accent0,
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    fontSize: "24px",
    textAlign: "center",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "20px",
  },
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "16px",
  alignItems: "center",
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    width: "100%",
    maxWidth: "300px",
  },
  [theme.breakpoints.down("sm")]: {
    gap: "12px",
  },
}));

const LaunchButton = styled(Button)(({ theme }) => ({
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  height: "48px",
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "8px",
  paddingBottom: "8px",
  borderRadius: "100px",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  lineHeight: "16px",
  "&:hover": {
    backgroundColor: canonHeaderTokens.brand.greenLight,
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
}));

const DocsButton = styled(Button)(({ theme }) => ({
  borderColor: canonHeaderTokens.foreground.accent40,
  color: canonHeaderTokens.foreground.accent10,
  height: "48px",
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "8px",
  paddingBottom: "8px",
  borderRadius: "100px",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  lineHeight: "16px",
  "&:hover": {
    borderColor: canonHeaderTokens.foreground.accent30,
    backgroundColor: "rgba(55, 55, 62, 0.1)",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
}));
