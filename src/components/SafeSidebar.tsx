import { Menu as MenuIcon } from "@mui/icons-material";
import { Box, Drawer, IconButton, styled } from "@mui/material";
import { VaultInfo, TabType } from "~/types/canon-guard";
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
}

export const SafeSidebar = ({ safeInfo, activeTab, onTabChange, collapsed, onToggleCollapse }: SafeSidebarProps) => {
  const drawerContent = (
    <SidebarContainer>
      <SidebarHeader collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      <SidebarSafeInfo safeInfo={safeInfo} collapsed={collapsed} />
      <SidebarNavigation activeTab={activeTab} onTabChange={onTabChange} collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </SidebarContainer>
  );

  const isMobile = window.innerWidth < 768;

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <MobileToggleButton onClick={onToggleCollapse}>
          <MenuIcon />
        </MobileToggleButton>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <DesktopSidebar variant='permanent' collapsed={collapsed}>
          {drawerContent}
        </DesktopSidebar>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer variant='temporary' open={!collapsed} onClose={onToggleCollapse} ModalProps={{ keepMounted: true }}>
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

// Styled Components
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
