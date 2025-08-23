import React, { useMemo, useCallback } from "react";
import { Language, MoreVert, ContentCopy, OpenInNew, Explore, Clear } from "@mui/icons-material";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  styled,
} from "@mui/material";
import { useStateContext } from "~/hooks/useStateContext";
import { SafeInfo } from "~/types/safe";
import { truncateAddress } from "~/utils";
import safeLogoBlack from "~/assets/safe-logo-black.png";
import safeLogoWhite from "~/assets/safe-logo-white.png";

// Menu configuration
const createMenuItems = (safeInfo: SafeInfo, clearVaultConfig: () => void, handleMenuClose: () => void) => [
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
      window.open(`https://app.safe.global/home?safe=eth:${safeInfo.address}`, "_blank");
      handleMenuClose();
    },
  },
  {
    icon: <Explore fontSize='small' />,
    label: "View on Explorer",
    onClick: () => {
      window.open(`https://etherscan.io/address/${safeInfo.address}`, "_blank");
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

interface SidebarSafeInfoProps {
  safeInfo: SafeInfo;
  collapsed: boolean;
}

export const SidebarSafeInfo = ({ safeInfo, collapsed }: SidebarSafeInfoProps) => {
  const theme = useTheme();
  const { clearVaultConfig } = useStateContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const formatAddress = (address: string) => {
    return collapsed ? truncateAddress(address).slice(0, 9) : truncateAddress(address);
  };

  const menuItems = useMemo(
    () => createMenuItems(safeInfo, clearVaultConfig, handleMenuClose),
    [safeInfo, clearVaultConfig, handleMenuClose],
  );

  return (
    <>
      {/* Network */}
      <SidebarSection>
        {collapsed ? (
          <Tooltip title={`Network: ${safeInfo.network}`} placement='right'>
            <Box display='flex' justifyContent='center'>
              <Language />
            </Box>
          </Tooltip>
        ) : (
          <Chip label={safeInfo.network} size='small' color='primary' />
        )}
      </SidebarSection>

      {/* Safe Address */}
      <SafeAddressContainer>
        {collapsed && (
          <Box display='flex' flexDirection='column' alignItems='center' gap={1}>
            <Tooltip title={`Safe Address: ${safeInfo.address}`} placement='right'>
              <img
                src={theme.palette.mode === "dark" ? safeLogoWhite : safeLogoBlack}
                alt='Safe Logo'
                style={{ width: 24, height: 24 }}
              />
            </Tooltip>
            <Tooltip title={`${safeInfo.approvalThreshold}/${safeInfo.totalOwners} threshold`} placement='right'>
              <Typography variant='caption' sx={{ fontSize: "0.7rem" }}>
                {safeInfo.approvalThreshold}/{safeInfo.totalOwners}
              </Typography>
            </Tooltip>
          </Box>
        )}
        {!collapsed && (
          <Box display='flex' alignItems='center' gap={1}>
            <img
              src={theme.palette.mode === "dark" ? safeLogoWhite : safeLogoBlack}
              alt='Safe Logo'
              style={{ width: 20, height: 20 }}
            />
            <Typography variant='body2' sx={{ flex: 1, fontSize: "0.8rem" }}>
              {formatAddress(safeInfo.address)}
            </Typography>
            <ThresholdBadge variant='caption'>
              {safeInfo.approvalThreshold}/{safeInfo.totalOwners}
            </ThresholdBadge>
            <IconButton size='small' onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          </Box>
        )}
      </SafeAddressContainer>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {menuItems.map((item, index) => (
          <MenuItem key={index} onClick={item.onClick}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// Styled Components
const SidebarSection = styled(Box)(({ theme }) => ({
  padding: 16,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SafeAddressContainer = styled(Box)(({ theme }) => ({
  padding: 16,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ThresholdBadge = styled(Typography)(({ theme }) => ({
  fontSize: "0.7rem",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: "2px 4px",
  borderRadius: 4,
  display: "inline-block",
}));
