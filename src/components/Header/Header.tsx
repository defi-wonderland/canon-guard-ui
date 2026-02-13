import { useState } from "react";
import { Close, Menu } from "@mui/icons-material";
import { Box, Drawer, styled, useMediaQuery, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Address } from "viem";
import { Chain } from "viem/chains";
import { WalletConnectIcon } from "~/components/icons/WalletConnectIcon";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams, useSafeStorage, useWallet, useIsSigner } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import { useWalletConnect } from "~/providers/WalletConnectProvider";
import { truncateAddress } from "~/utils";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderNav } from "./HeaderNav";
import { HeaderSafeDropdown } from "./HeaderSafeDropdown";
import { HeaderWalletDropdown } from "./HeaderWalletDropdown";

interface HeaderProps {
  /** Safe address (required when not in minimal mode) */
  safeAddress?: string;
  /** Chain configuration (required when not in minimal mode) */
  chain?: Chain;
  /** Number of items in queue for badge display */
  queueCount?: number;
  /** Callback to clear the current Safe configuration */
  onClearConfig: () => void;
  /** When true, hides nav, create button, safe dropdown - shows only logo and wallet */
  isMinimalMode?: boolean;
}

export const Header = ({ safeAddress, chain, queueCount = 0, onClearConfig, isMinimalMode = false }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateWithParams = useNavigateWithParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { guardAddress } = useStateContext();
  const { isInitialized, openModal, sessions } = useWalletConnect();
  const { isConnected, address, connect, disconnect } = useWallet();
  const { savedSafesCount } = useSafeStorage();
  const isSigner = useIsSigner();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCreateActive = location.pathname.startsWith("/create");
  const isQueueActive = location.pathname === "/queue" || location.pathname === "/";
  const isCanonListActive = location.pathname === "/canon-list";
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const hasActiveSessions = safeSessions.length > 0;

  // Determine if CREATE button should be disabled and why
  const getCreateDisableReason = (): string | null => {
    if (!isSigner) return "Connected wallet is not a signer";
    return null;
  };
  const createDisableReason = getCreateDisableReason();
  const mobileWalletLabel = isConnected ? truncateAddress(address || "") : "Connect Wallet";

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileNavigate = (path: string) => {
    navigateWithParams(path);
    closeMobileMenu();
  };

  const handleMobileSettings = () => {
    navigateWithParams("/settings");
    closeMobileMenu();
  };

  const handleMobileManageSafes = () => {
    navigate("/settings/safes");
    closeMobileMenu();
  };

  const handleMobileCreate = () => {
    if (createDisableReason) return;
    navigateWithParams("/create");
    closeMobileMenu();
  };

  const handleMobileWallet = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
    closeMobileMenu();
  };

  // In minimal mode, only show logo and wallet dropdown
  if (isMinimalMode) {
    return (
      <HeaderContainer>
        <HeaderLeftSection>
          <LogoSection>
            <HeaderLogo onClick={onClearConfig} />
          </LogoSection>
        </HeaderLeftSection>
        <HeaderWalletDropdown />
      </HeaderContainer>
    );
  }

  // Mobile mode: use hamburger drawer to avoid header overflow.
  if (isMobile) {
    return (
      <HeaderContainer>
        <HeaderLeftSection>
          <LogoSection>
            <HeaderLogo onClick={onClearConfig} />
          </LogoSection>
        </HeaderLeftSection>

        {isInitialized && (
          <WalletConnectButton
            onClick={openModal}
            $hasActiveSessions={hasActiveSessions}
            aria-label='Open WalletConnect'
          >
            <WalletConnectIcon
              size={24}
              color={hasActiveSessions ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent20}
            />
          </WalletConnectButton>
        )}

        <MobileMenuButton
          onClick={() => setMobileMenuOpen(true)}
          aria-label='Open menu'
          data-testid='mobile-menu-button'
        >
          <Menu fontSize='small' />
        </MobileMenuButton>

        <MobileDrawer anchor='right' open={mobileMenuOpen} onClose={closeMobileMenu} ModalProps={{ keepMounted: true }}>
          <MobileDrawerContent>
            <MobileDrawerHeader>
              <MobileDrawerTitle>Menu</MobileDrawerTitle>
              <MobileIconButton onClick={closeMobileMenu} aria-label='Close menu'>
                <Close fontSize='small' />
              </MobileIconButton>
            </MobileDrawerHeader>

            <MobileSection>
              <MobileSectionLabel>Navigation</MobileSectionLabel>
              <MobileNavButton $isActive={isQueueActive} onClick={() => handleMobileNavigate("/queue")}>
                Queue
                {queueCount > 0 && <MobileQueueBadge>{queueCount}</MobileQueueBadge>}
              </MobileNavButton>
              <MobileNavButton $isActive={isCanonListActive} onClick={() => handleMobileNavigate("/canon-list")}>
                Canon List
              </MobileNavButton>
              {isConnected && (
                <StyledTooltip
                  title={createDisableReason || ""}
                  placement='top'
                  disableHoverListener={!createDisableReason}
                  disableInteractive={!!createDisableReason}
                >
                  <span>
                    <MobileActionButton onClick={handleMobileCreate} disabled={!!createDisableReason}>
                      Create
                    </MobileActionButton>
                  </span>
                </StyledTooltip>
              )}
            </MobileSection>

            <MobileSection>
              <MobileSectionLabel>Safe</MobileSectionLabel>
              <MobileSafeSummary>
                <MobileSafeLine>Safe {truncateAddress(safeAddress || "")}</MobileSafeLine>
                <MobileSafeSubLine>{chain?.name || "Unknown Chain"}</MobileSafeSubLine>
              </MobileSafeSummary>
              <MobileLinkButton onClick={handleMobileSettings}>Settings</MobileLinkButton>
              <MobileLinkButton onClick={handleMobileManageSafes}>
                Manage Safe Accounts{savedSafesCount > 0 ? ` (${savedSafesCount})` : ""}
              </MobileLinkButton>
            </MobileSection>

            <MobileSection>
              <MobileSectionLabel>Wallet</MobileSectionLabel>
              <MobileWalletButton onClick={handleMobileWallet}>
                {isConnected ? `Disconnect ${mobileWalletLabel}` : "Connect Wallet"}
              </MobileWalletButton>
            </MobileSection>
          </MobileDrawerContent>
        </MobileDrawer>
      </HeaderContainer>
    );
  }

  return (
    <HeaderContainer>
      {/* Left section: Logo + Nav (flex: 1 to fill space) */}
      <HeaderLeftSection>
        <LogoSection>
          <HeaderLogo onClick={onClearConfig} />
        </LogoSection>
        <NavSection>
          <HeaderNav queueCount={queueCount} />
        </NavSection>
      </HeaderLeftSection>

      {/* WalletConnect button */}
      {isInitialized && (
        <WalletConnectButton onClick={openModal} $hasActiveSessions={hasActiveSessions}>
          <WalletConnectIcon
            size={28}
            color={hasActiveSessions ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent20}
          />
        </WalletConnectButton>
      )}

      {/* Right section: CREATE | Safe | Wallet with dividers */}
      {/* CREATE button: hidden if disconnected, disabled with tooltip if not signer */}
      {isConnected && (
        <StyledTooltip title={createDisableReason || ""} placement='bottom' disableHoverListener={!createDisableReason}>
          <CreateButtonTooltipWrapper>
            <CreateButton
              $isActive={isCreateActive}
              $disabled={!!createDisableReason}
              onClick={() => !createDisableReason && navigateWithParams("/create")}
              data-testid='create-button'
            >
              CREATE
            </CreateButton>
          </CreateButtonTooltipWrapper>
        </StyledTooltip>
      )}
      <HeaderSafeDropdown
        safeAddress={safeAddress!}
        chain={chain!}
        guardAddress={guardAddress as Address | null}
        onClearConfig={onClearConfig}
      />
      <HeaderWalletDropdown />
    </HeaderContainer>
  );
};

// Main container - dark background shows through gaps as dividers
const HeaderContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "72px",
  flexShrink: 0,
  backgroundColor: canonHeaderTokens.background.layer0,
  width: "100%",
  gap: "1px",
});

// Left section groups logo and nav together
const HeaderLeftSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "100%",
  flex: 1,
  backgroundColor: canonHeaderTokens.background.layer1,
});

const LogoSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "100%",
});

const NavSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "100%",
});

const CreateButtonTooltipWrapper = styled("span")({
  display: "flex",
  height: "100%",
});

// WalletConnect button
const WalletConnectButton = styled("button")<{ $hasActiveSessions?: boolean }>(({ $hasActiveSessions }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 24px",
  background: canonHeaderTokens.background.layer1,
  border: "none",
  cursor: "pointer",
  position: "relative",
  "&:hover": {
    opacity: 0.8,
  },
  // Active indicator dot
  "&::after": $hasActiveSessions
    ? {
        content: '""',
        position: "absolute",
        top: "50%",
        right: "8px",
        transform: "translateY(-50%)",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: canonHeaderTokens.brand.green,
      }
    : {},
}));

// CREATE button with layer1 background for divider effect
const CreateButton = styled("button")<{ $isActive?: boolean; $disabled?: boolean }>(({ $disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 32px",
  background: canonHeaderTokens.background.layer1,
  border: "none",
  cursor: $disabled ? "not-allowed" : "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: $disabled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.brand.green,
  "&:hover": {
    opacity: $disabled ? 1 : 0.8,
  },
}));

const MobileMenuButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "64px",
  border: "none",
  background: canonHeaderTokens.background.layer1,
  color: canonHeaderTokens.foreground.accent10,
  cursor: "pointer",
  "&:hover": {
    opacity: 0.85,
  },
});

const MobileDrawer = styled(Drawer)({
  "& .MuiDrawer-paper": {
    width: "320px",
    maxWidth: "86vw",
    borderLeft: `1px solid ${canonHeaderTokens.foreground.accent40}`,
    backgroundColor: canonHeaderTokens.background.layer1,
  },
});

const MobileDrawerContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
  height: "100%",
});

const MobileDrawerHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const MobileDrawerTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent0,
});

const MobileIconButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "8px",
  background: canonHeaderTokens.background.layer1,
  color: canonHeaderTokens.foreground.accent20,
  cursor: "pointer",
});

const MobileSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  paddingTop: "10px",
  borderTop: `1px solid ${canonHeaderTokens.foreground.accent40}`,
});

const MobileSectionLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
});

const MobileNavButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "8px",
  border: `1px solid ${$isActive ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent40}`,
  backgroundColor: canonHeaderTokens.background.layer1,
  color: canonHeaderTokens.foreground.accent0,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  cursor: "pointer",
}));

const MobileQueueBadge = styled("span")({
  fontSize: "11px",
  color: canonHeaderTokens.brand.green,
});

const MobileActionButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  width: "100%",
  minHeight: "40px",
  borderRadius: "100px",
  border: "none",
  backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
}));

const MobileSafeSummary = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "10px 12px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
});

const MobileSafeLine = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  color: canonHeaderTokens.foreground.accent0,
});

const MobileSafeSubLine = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  color: canonHeaderTokens.foreground.accent20,
});

const MobileLinkButton = styled("button")({
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "8px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  backgroundColor: canonHeaderTokens.background.layer1,
  color: canonHeaderTokens.foreground.accent10,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  textAlign: "left",
  cursor: "pointer",
});

const MobileWalletButton = styled("button")({
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "8px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  backgroundColor: canonHeaderTokens.background.layer1,
  color: canonHeaderTokens.foreground.accent10,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  textAlign: "left",
  cursor: "pointer",
});
