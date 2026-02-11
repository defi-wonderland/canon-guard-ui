import { Box, styled } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Address } from "viem";
import { Chain } from "viem/chains";
import { WalletConnectIcon } from "~/components/icons/WalletConnectIcon";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams, useWallet, useIsSigner } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import { useWalletConnect } from "~/providers/WalletConnectProvider";
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
  const navigateWithParams = useNavigateWithParams();
  const { guardAddress } = useStateContext();
  const { isInitialized, openModal, sessions } = useWalletConnect();
  const { isConnected } = useWallet();
  const isSigner = useIsSigner();
  const isCreateActive = location.pathname.startsWith("/create");
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const hasActiveSessions = safeSessions.length > 0;

  // Determine if CREATE button should be disabled and why
  const getCreateDisableReason = (): string | null => {
    if (!isSigner) return "Connected wallet is not a signer";
    return null;
  };
  const createDisableReason = getCreateDisableReason();

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
          <span style={{ display: "flex", height: "100%" }}>
            <CreateButton
              $isActive={isCreateActive}
              $disabled={!!createDisableReason}
              onClick={() => !createDisableReason && navigateWithParams("/create")}
              data-testid='create-button'
            >
              CREATE
            </CreateButton>
          </span>
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
