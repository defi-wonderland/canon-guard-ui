import { Queue, CheckCircle, History, Settings } from "@mui/icons-material";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip } from "@mui/material";
import { TabType } from "~/types/canon-guard";

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
    <List sx={{ flex: 1, py: 0 }}>
      {navigationItems.map((item) => (
        <ListItem key={item.id} disablePadding>
          {collapsed ? (
            <Tooltip title={item.label} placement='right'>
              <IconButton
                onClick={() => onTabChange(item.id)}
                sx={{
                  width: "100%",
                  borderRadius: 0,
                  color: activeTab === item.id ? "primary.main" : "text.secondary",
                  backgroundColor: activeTab === item.id ? "action.selected" : "transparent",
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ) : (
            <ListItemButton
              selected={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              sx={{
                borderRadius: 0,
                "&.Mui-selected": {
                  backgroundColor: "action.selected",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )}
        </ListItem>
      ))}
    </List>
  );
};
