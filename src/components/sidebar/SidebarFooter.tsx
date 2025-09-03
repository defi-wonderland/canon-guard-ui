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
          <StyledSpan>
            <StyledIconButton disabled>
              <AccountBalanceWallet />
            </StyledIconButton>
          </StyledSpan>
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

const StyledFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: "auto",
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const StyledSpan = styled("span")({
  width: "100%",
});

const StyledIconButton = styled(IconButton)({
  width: "100%",
});
