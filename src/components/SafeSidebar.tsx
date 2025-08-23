import { Menu as MenuIcon } from "@mui/icons-material";
import { Box, Drawer, IconButton, styled } from "@mui/material";
import { SafeInfo, TabType } from "~/types/safe";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarSafeInfo } from "./sidebar/SidebarSafeInfo";

interface SafeSidebarProps {
  safeInfo: SafeInfo;
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
      {isMobile && collapsed && <MobileToggle onClick={onToggleCollapse} />}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? !collapsed : true}
        onClose={isMobile ? onToggleCollapse : undefined}
        sx={{
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? 280 : collapsed ? 64 : 280,
            ...(isMobile ? {} : { position: "fixed", height: "100vh" }),
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

// Styled Components
const SidebarContainer = styled(Box)(() => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

const MobileToggle = ({ onClick }: { onClick: () => void }) => (
  <IconButton
    onClick={onClick}
    sx={{
      position: "fixed",
      top: 16,
      left: 16,
      zIndex: 1300,
      bgcolor: "background.paper",
    }}
  >
    <MenuIcon />
  </IconButton>
);
