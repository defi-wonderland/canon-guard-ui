import { AccountBalanceWallet } from "@mui/icons-material";
import { Box, Button, IconButton, styled, Tooltip } from "@mui/material";

interface SidebarFooterProps {
  collapsed: boolean;
}

export const SidebarFooter = ({ collapsed }: SidebarFooterProps) => {
  return (
    <StyledFooter display='flex' justifyContent='center'>
      {collapsed && (
        <Tooltip title='Connect Wallet' placement='right'>
          <IconButton disabled sx={{ width: "100%" }}>
            <AccountBalanceWallet />
          </IconButton>
        </Tooltip>
      )}
      {!collapsed && (
        <Button variant='contained' disabled fullWidth>
          Connect Wallet
        </Button>
      )}
    </StyledFooter>
  );
};

const StyledFooter = styled(Box)(() => ({
  padding: 2,
  borderTop: 1,
  borderColor: "divider",
}));
