import { Menu as MenuIcon } from "@mui/icons-material";
import { Box, Drawer, IconButton, styled } from "@mui/material";
import { optimism } from "viem/chains";
import { VaultInfo, TabType } from "~/types";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarSafeInfo } from "./sidebar/SidebarSafeInfo";

interface SafeSidebarProps {
  safeInfo: VaultInfo;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClearVaultConfig: () => void;
}

export const SafeSidebar = ({
  safeInfo,
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onClearVaultConfig,
}: SafeSidebarProps) => {
  const drawerContent = (
    <SidebarContainer>
      <SidebarHeader collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      <SidebarSafeInfo
        safeInfo={safeInfo}
        collapsed={collapsed}
        chain={optimism}
        onClearVaultConfig={onClearVaultConfig}
      />
      <SidebarNavigation activeTab={activeTab} onTabChange={onTabChange} collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </SidebarContainer>
  );

  const isMobile = window.innerWidth < 768;

  return (
    <>
      {isMobile && (
        <MobileToggleButton onClick={onToggleCollapse}>
          <MenuIcon />
        </MobileToggleButton>
      )}

      {!isMobile && (
        <DesktopSidebar variant='permanent' collapsed={collapsed}>
          {drawerContent}
        </DesktopSidebar>
      )}

      {isMobile && (
        <Drawer variant='temporary' open={!collapsed} onClose={onToggleCollapse} ModalProps={{ keepMounted: true }}>
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

const SidebarContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const DesktopSidebar = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "collapsed",
})<{ collapsed: boolean }>(({ collapsed }) => ({
  "& .MuiDrawer-paper": {
    width: collapsed ? 60 : 240,
    transition: "width 0.3s ease-in-out",
    overflowX: "hidden",
    position: "fixed",
    height: "100vh",
    zIndex: 1200,
  },
}));

const MobileToggleButton = styled(IconButton)(({ theme }) => ({
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 1300,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
