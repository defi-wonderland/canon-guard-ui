import React, { useMemo, useCallback } from "react";
import { ContentCopy, OpenInNew, Explore, Clear } from "@mui/icons-material";
import { Box, Menu, MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import { Chain, mainnet, optimism } from "viem/chains";
import { VaultInfo } from "~/types/canon-guard";
import { SidebarSafeInfoCollapsed, SidebarSafeInfoExpanded } from "./SidebarSafeInfoParts";

const getSafeNetworkPrefix = (chain: Chain): string => {
  switch (chain.id) {
    case optimism.id:
      return "oeth";
    case mainnet.id:
      return "eth";
    default:
      return "eth";
  }
};

const createMenuItems = (
  safeInfo: VaultInfo,
  onClearVaultConfig: () => void,
  handleMenuClose: () => void,
  chain: Chain,
) => {
  const safeNetworkPrefix = getSafeNetworkPrefix(chain);

  return [
    {
      icon: <ContentCopy fontSize='small' />,
      label: "Copy Address",
      onClick: () => {
        navigator.clipboard.writeText(safeInfo.address);
        handleMenuClose();
      },
    },
    {
      icon: <OpenInNew fontSize='small' />,
      label: "View on Safe",
      onClick: () => {
        window.open(`https://app.safe.global/home?safe=${safeNetworkPrefix}:${safeInfo.address}`, "_blank");
        handleMenuClose();
      },
    },
    {
      icon: <Explore fontSize='small' />,
      label: "View on Explorer",
      onClick: () => {
        window.open(`${chain.blockExplorers?.default?.url}/address/${safeInfo.address}`, "_blank");
        handleMenuClose();
      },
    },
    {
      icon: <Clear fontSize='small' />,
      label: "Clear Vault Configuration",
      onClick: () => {
        onClearVaultConfig();
        handleMenuClose();
      },
    },
  ];
};

interface SidebarSafeInfoProps {
  safeInfo: VaultInfo;
  collapsed: boolean;
  chain: Chain;
  onClearVaultConfig: () => void;
}

export const SidebarSafeInfo = ({ safeInfo, collapsed, chain, onClearVaultConfig }: SidebarSafeInfoProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const menuItems = useMemo(
    () => createMenuItems(safeInfo, onClearVaultConfig, handleMenuClose, chain),
    [safeInfo, onClearVaultConfig, handleMenuClose, chain],
  );

  return (
    <>
      <SafeInfoContainer>
        {collapsed && <SidebarSafeInfoCollapsed safeInfo={safeInfo} onMenuClick={handleMenuClick} />}

        {!collapsed && <SidebarSafeInfoExpanded safeInfo={safeInfo} onMenuClick={handleMenuClick} />}
      </SafeInfoContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {menuItems.map((item, index) => (
          <StyledMenuItem key={index} onClick={item.onClick}>
            <StyledListItemIcon>{item.icon}</StyledListItemIcon>
            <ListItemText primary={item.label} />
          </StyledMenuItem>
        ))}
      </Menu>
    </>
  );
};

const SafeInfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const StyledMenuItem = styled(MenuItem)({
  fontSize: "0.875rem",
});

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: 32,
});
