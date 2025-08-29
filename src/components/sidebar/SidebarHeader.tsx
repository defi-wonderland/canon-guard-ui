import { Menu as MenuIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import { Box, Typography, IconButton, styled } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarHeader = ({ collapsed, onToggleCollapse }: SidebarHeaderProps) => {
  const { mode, setMode } = useColorScheme();

  const changeTheme = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <StyledHeader>
      {!collapsed && (
        <Typography variant='h6' color='primary.main'>
          Canon Vault
        </Typography>
      )}
      <IconButton onClick={onToggleCollapse} size='small'>
        <MenuIcon />
      </IconButton>
      {!collapsed && (
        <IconButton onClick={changeTheme} size='small'>
          {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      )}
    </StyledHeader>
  );
};

const StyledHeader = styled(Box)(() => ({
  padding: 12,
  borderBottom: 1,
  borderColor: "divider",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));
