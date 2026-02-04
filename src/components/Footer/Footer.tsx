import { Box, styled } from "@mui/material";
import { Sun, Moon } from "lucide-react";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import EthereumLogo from "~/assets/ethereum-logo.svg";

// Version info - can be replaced with build-time injection
const VERSION = "v1.0.0beta";

// External links
const LINKS = {
  // documentation: "https://docs.canonguard.xyz",
  // securityAudit: "https://github.com/defi-wonderland/canon-guard/tree/main/audits",
  github: "https://github.com/defi-wonderland/canon-guard",
};

interface FooterProps {
  themeMode?: "light" | "dark";
  onToggleTheme?: () => void;
}

export const Footer = ({ themeMode = "dark", onToggleTheme }: FooterProps) => {
  return (
    <FooterContainer>
      <LeftSection>
        <VersionText>{VERSION}</VersionText>
        {/* <FooterLink href={LINKS.documentation} target='_blank' rel='noopener noreferrer'>
          Documentation
        </FooterLink>
        <FooterLink href={LINKS.securityAudit} target='_blank' rel='noopener noreferrer'>
          Security Audit
        </FooterLink> */}
        <FooterLink href={LINKS.github} target='_blank' rel='noopener noreferrer'>
          GitHub
        </FooterLink>
      </LeftSection>

      <RightSection>
        <PublicGoodSection>
          <PublicGoodText>A public good for</PublicGoodText>
          <EthereumLink href='https://ethereum.org/' target='_blank' rel='noopener noreferrer'>
            <EthereumLogoImg src={EthereumLogo} alt='Ethereum' />
            <EthereumText>Ethereum</EthereumText>
          </EthereumLink>
        </PublicGoodSection>

        {onToggleTheme && (
          <ThemeModeButton onClick={onToggleTheme} aria-label='Toggle theme'>
            {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </ThemeModeButton>
        )}
      </RightSection>
    </FooterContainer>
  );
};

const FooterContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px 24px 24px",
  width: "100%",
  background: "none",
});

const LeftSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const RightSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const VersionText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
});

const FooterLink = styled("a")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textDecoration: "none",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});

const PublicGoodSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const PublicGoodText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  fontStyle: "italic",
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
});

const EthereumLink = styled("a")({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  textDecoration: "none",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});

const EthereumLogoImg = styled("img")({
  width: "8.6px",
  height: "14px",
});

const EthereumText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ThemeModeButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  borderRadius: "100px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: canonHeaderTokens.foreground.accent20,
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});
