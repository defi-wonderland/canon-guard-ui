import React, { useMemo, useCallback } from "react";
import { ContentCopy, OpenInNew, Explore, Clear } from "@mui/icons-material";
import { Box, Menu, MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import { Chain } from "viem";
import { useStateContext } from "~/hooks/useStateContext";
import { VaultInfo } from "~/types/canon-guard";
import { SidebarSafeInfoCollapsed, SidebarSafeInfoExpanded } from "./SidebarSafeInfoParts";

// Helper function to get Safe network prefix
const getSafeNetworkPrefix = (chain: Chain): string => {
  switch (chain.id) {
    case 10: // Optimism
      return "oeth";
    case 1: // Ethereum
      return "eth";
    // Add more networks as needed
    default:
      return "eth";
  }
};

// Menu configuration
const createMenuItems = (
  safeInfo: VaultInfo,
  clearVaultConfig: () => void,
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
        clearVaultConfig();
        handleMenuClose();
      },
    },
  ];
};

interface SidebarSafeInfoProps {
  safeInfo: VaultInfo;
  collapsed: boolean;
  chain: Chain;
}

export const SidebarSafeInfo = ({ safeInfo, collapsed, chain }: SidebarSafeInfoProps) => {
  const { clearVaultConfig } = useStateContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const menuItems = useMemo(
    () => createMenuItems(safeInfo, clearVaultConfig, handleMenuClose, chain),
    [safeInfo, clearVaultConfig, handleMenuClose, chain],
  );

  return (
    <>
      <SafeInfoContainer>
        {/* Collapsed state */}
        {collapsed && <SidebarSafeInfoCollapsed safeInfo={safeInfo} onMenuClick={handleMenuClick} />}

        {/* Expanded state */}
        {!collapsed && <SidebarSafeInfoExpanded safeInfo={safeInfo} onMenuClick={handleMenuClick} />}
      </SafeInfoContainer>

      {/* Menu is always available regardless of collapsed state */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {menuItems.map((item, index) => (
          <MenuItem key={index} onClick={item.onClick} sx={{ fontSize: "0.875rem" }}>
            <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// Styled Components
const SafeInfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));
