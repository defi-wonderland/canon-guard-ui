import { useState } from "react";
import { KeyboardArrowDown } from "@mui/icons-material";
import { Box, styled, CircularProgress } from "@mui/material";
import { LogOutIcon, WalletIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useWallet } from "~/hooks";
import { truncateAddress } from "~/utils";

export const HeaderWalletDropdown = () => {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleButtonClick = () => {
    if (isConnected) {
      setMenuOpen(!menuOpen);
    } else {
      connect();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setMenuOpen(false);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  // Disconnected state - show CONNECT button
  if (!isConnected) {
    return (
      <ConnectButtonWrapper>
        <ConnectButton onClick={handleButtonClick} disabled={isConnecting}>
          {isConnecting ? (
            <CircularProgress size={14} sx={{ color: canonHeaderTokens.foreground.accent10 }} />
          ) : (
            "CONNECT"
          )}
        </ConnectButton>
      </ConnectButtonWrapper>
    );
  }

  // Connected state - show address with dropdown
  return (
    <WalletWrapper>
      <DropdownButton onClick={handleButtonClick}>
        <DropdownContent>
          <DropdownRow>
            <DropdownValue>{truncateAddress(address || "")}</DropdownValue>
            <ChevronIcon />
          </DropdownRow>
          <StatusRow>
            <StatusLabel>Wallet</StatusLabel>
            <StatusDot />
          </StatusRow>
        </DropdownContent>
      </DropdownButton>

      {/* Backdrop to close menu */}
      {menuOpen && <MenuBackdrop onClick={handleCloseMenu} />}

      {/* Custom dropdown menu */}
      <WalletMenu $isOpen={menuOpen}>
        {/* Info section */}
        <MenuInfoSection>
          <MenuInfoText>You can disconnect and switch to a different wallet.</MenuInfoText>
          <MenuIconWrapper>
            <WalletIcon size={24} color={canonHeaderTokens.foreground.accent20} />
          </MenuIconWrapper>
        </MenuInfoSection>

        {/* Divider */}
        <MenuDivider />

        {/* Disconnect button */}
        <MenuDisconnectButton onClick={handleDisconnect}>
          <LogOutIcon size={16} color={canonHeaderTokens.foreground.accent10} />
          <MenuDisconnectText>Disconnect Wallet</MenuDisconnectText>
        </MenuDisconnectButton>
      </WalletMenu>
    </WalletWrapper>
  );
};

// Connected state styles - wrapper for proper gap behavior
const WalletWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "100%",
  background: canonHeaderTokens.background.layer1,
});

const DropdownButton = styled("button")({
  display: "flex",
  alignItems: "center",
  height: "100%",
  padding: "0 12px 0 20px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    opacity: 0.9,
  },
});

const DropdownContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "flex-start",
  justifyContent: "center",
  minWidth: "100px",
});

const DropdownRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap: "6px",
});

const DropdownValue = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent10,
});

const ChevronIcon = styled(KeyboardArrowDown)({
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent10,
});

const StatusRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const StatusLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
});

const StatusDot = styled("div")({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: canonHeaderTokens.brand.green,
});

// Disconnected state styles - CONNECT button
const ConnectButtonWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 16px 0 20px",
  background: canonHeaderTokens.background.layer1,
});

const ConnectButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "36px",
  padding: "8px 20px",
  minWidth: "140px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.foreground.accent40}20`,
  },
  "&:disabled": {
    cursor: "wait",
    opacity: 0.7,
  },
});

// Menu backdrop
const MenuBackdrop = styled("div")({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
});

// Wallet menu dropdown
const WalletMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})<{ $isOpen: boolean }>(({ $isOpen }) => ({
  position: "absolute",
  top: "78px",
  right: "12px",
  width: "280px",
  borderRadius: "12px",
  border: `0.5px solid ${canonHeaderTokens.foreground.accent40}`,
  backgroundColor: canonHeaderTokens.background.layer1,
  boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)",
  overflow: "hidden",
  zIndex: 1000,
  opacity: $isOpen ? 1 : 0,
  visibility: $isOpen ? "visible" : "hidden",
  transform: $isOpen ? "translateY(0)" : "translateY(-8px)",
  transition: "opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease",
}));

const MenuInfoSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
});

const MenuInfoText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  width: "177px",
  margin: 0,
});

const MenuIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer2,
});

const MenuDivider = styled("div")({
  width: "100%",
  height: "0.5px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

const MenuDisconnectButton = styled("button")({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  width: "100%",
  padding: "16px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer0,
  },
});

const MenuDisconnectText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});
