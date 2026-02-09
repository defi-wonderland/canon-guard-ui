import { Box, Button, styled, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import EthereumLogo from "~/assets/ethereum-logo.svg";

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

      <Footer>
        <FooterLeft>
          <FooterLink>v1.0.0beta+fd0685</FooterLink>
          <FooterLinkActive>Documentation</FooterLinkActive>
          <FooterLinkActive>Security Audit</FooterLinkActive>
          <FooterLinkActive>GitHub</FooterLinkActive>
        </FooterLeft>

        <FooterRight>
          <PublicGoodSection>
            <PublicGoodText>A public good for</PublicGoodText>
            <EthLogoContainer>
              <img src={EthereumLogo} alt='Ethereum' />
            </EthLogoContainer>
            <EthereumText>Ethereum</EthereumText>
          </PublicGoodSection>
        </FooterRight>
      </Footer>
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

const LogoContainer = styled(Box)({
  display: "flex",
  gap: "4px",
  alignItems: "center",
  height: "100%",
  paddingLeft: "28px",
  fontSize: "20px",
  lineHeight: 0,
  color: canonHeaderTokens.foreground.accent0,
  whiteSpace: "nowrap",
});

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

const HeroSection = styled(Box)({
  display: "flex",
  gap: "32px",
  alignItems: "center",
  paddingLeft: "120px",
  paddingRight: "120px",
  flexShrink: 0,
});

const HeroLine = styled(Box)({
  width: "120px",
  height: "1px",
  backgroundColor: canonHeaderTokens.foreground.accent0,
  flexShrink: 0,
});

const HeroText = styled(Typography)({
  fontSize: "28px",
  fontWeight: 200,
  fontStyle: "italic",
  lineHeight: "normal",
  color: canonHeaderTokens.foreground.accent0,
  flexShrink: 0,
});

const ButtonGroup = styled(Box)({
  display: "flex",
  gap: "16px",
  alignItems: "center",
  flexShrink: 0,
});

const LaunchButton = styled(Button)({
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
});

const DocsButton = styled(Button)({
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
});

const Footer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  paddingTop: "64px",
  paddingBottom: "24px",
  paddingLeft: "24px",
  paddingRight: "16px",
  flexShrink: 0,
});

const FooterLeft = styled(Box)({
  display: "flex",
  gap: "16px",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: 400,
  flexShrink: 0,
});

const FooterLink = styled(Typography)({
  fontSize: "13px",
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
  flexShrink: 0,
});

const FooterLinkActive = styled(Typography)({
  fontSize: "13px",
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  flexShrink: 0,
  cursor: "pointer",
  "&:hover": {
    color: canonHeaderTokens.foreground.accent10,
  },
});

const FooterRight = styled(Box)({
  display: "flex",
  gap: "16px",
  alignItems: "center",
  flexShrink: 0,
});

const PublicGoodSection = styled(Box)({
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexShrink: 0,
});

const PublicGoodText = styled(Typography)({
  fontSize: "13px",
  fontStyle: "italic",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
  flexShrink: 0,
});

const EthLogoContainer = styled(Box)({
  height: "14px",
  width: "8.595px",
  flexShrink: 0,
  overflow: "clip",
  "& img": {
    display: "block",
    maxWidth: "none",
    width: "100%",
    height: "100%",
  },
});

const EthereumText = styled(Typography)({
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  flexShrink: 0,
});
