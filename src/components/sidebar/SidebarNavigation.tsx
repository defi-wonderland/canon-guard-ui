import { Queue, CheckCircle, History, Settings } from "@mui/icons-material";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip, styled } from "@mui/material";
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
    <StyledList>
      {navigationItems.map((item) => (
        <ListItem key={item.id} disablePadding>
          {collapsed ? (
            <Tooltip title={item.label} placement='right'>
              <StyledIconButton onClick={() => onTabChange(item.id)} $isActive={activeTab === item.id}>
                {item.icon}
              </StyledIconButton>
            </Tooltip>
          ) : (
            <StyledListItemButton selected={activeTab === item.id} onClick={() => onTabChange(item.id)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </StyledListItemButton>
          )}
        </ListItem>
      ))}
    </StyledList>
  );
};

const StyledList = styled(List)({
  flex: 1,
  paddingTop: 0,
  paddingBottom: 0,
});

const StyledIconButton = styled(IconButton)<{ $isActive?: boolean }>(({ theme, $isActive }) => ({
  width: "100%",
  borderRadius: 0,
  color: $isActive ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: $isActive ? theme.palette.action.selected : "transparent",
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 0,
  "&.Mui-selected": {
    backgroundColor: theme.palette.action.selected,
    color: theme.palette.primary.main,
    "& .MuiListItemIcon-root": {
      color: theme.palette.primary.main,
    },
  },
}));
