import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, Typography, Button } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { zIndex, HEADER_HEIGHT } from "~/utils";

export const Header = () => {
  const { mode, setMode } = useColorScheme();

  const changeTheme = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <StyledHeader>
      <Typography data-testid='app-title' sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
        Canon Guard
      </Typography>
      <SIconButton onClick={changeTheme}>{mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}</SIconButton>
      <Button variant='contained' disabled sx={{ opacity: 0.5 }}>
        Connect Wallet
      </Button>
    </StyledHeader>
  );
};

//Styles
const StyledHeader = styled("header")(({ theme }) => {
  return [
    {
      display: "flex",
      height: `${HEADER_HEIGHT}rem`,
      padding: "0 8rem",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.palette.background.secondary,
      width: "100%",
      zIndex: zIndex.HEADER,
    },
  ];
});

const SIconButton = styled(IconButton)({
  position: "absolute",
  left: "50%",
});
