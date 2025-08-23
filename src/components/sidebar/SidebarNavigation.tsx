import { Queue, CheckCircle, History, Settings } from "@mui/icons-material";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip } from "@mui/material";
import { TabType } from "~/types/safe";

const navigationItems = [
  { id: TabType.QUEUE, label: "Queue", icon: <Queue /> },
  { id: TabType.PRE_APPROVED, label: "Pre-approved", icon: <CheckCircle /> },
  { id: TabType.HISTORY, label: "History", icon: <History /> },
  { id: TabType.CONFIGURATION, label: "Configuration", icon: <Settings /> },
];

interface SidebarNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
}

export const SidebarNavigation = ({ activeTab, onTabChange, collapsed }: SidebarNavigationProps) => {
  return (
    <List sx={{ flexGrow: 1, p: 1 }}>
      {navigationItems.map((item) => (
        <ListItem key={item.id} disablePadding>
          {collapsed && (
            <Tooltip title={item.label} placement='right'>
              <IconButton
                onClick={() => onTabChange(item.id)}
                color={activeTab === item.id ? "primary" : "default"}
                sx={{ width: "100%" }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          )}
          {!collapsed && (
            <ListItemButton selected={activeTab === item.id} onClick={() => onTabChange(item.id)} sx={{ mb: 0.5 }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )}
        </ListItem>
      ))}
    </List>
  );
};
