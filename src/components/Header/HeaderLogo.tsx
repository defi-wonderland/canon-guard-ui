import { styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface HeaderLogoProps {
  onClick?: () => void;
}

export const HeaderLogo = ({ onClick }: HeaderLogoProps) => {
  return (
    <LogoButton onClick={onClick} type='button' aria-label='Go to home'>
      <LogoBold>CANON</LogoBold>
      <LogoRegular>GUARD</LogoRegular>
    </LogoButton>
  );
};

const LogoButton = styled("button")({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "0 28px",
  fontSize: "20px",
  color: canonHeaderTokens.foreground.accent0,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  height: "100%",
  "&:hover": {
    opacity: 0.8,
  },
});

const LogoBold = styled("span")({
  fontWeight: 700,
  fontStyle: "italic",
});

const LogoRegular = styled("span")({
  fontWeight: 400,
  fontStyle: "italic",
});
