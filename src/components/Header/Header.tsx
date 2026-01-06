import { Box, styled } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Chain } from "viem/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams } from "~/hooks";
import { useStateContext } from "~/hooks/useStateContext";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderNav } from "./HeaderNav";
import { HeaderSafeDropdown } from "./HeaderSafeDropdown";
import { HeaderWalletDropdown } from "./HeaderWalletDropdown";
import type { Address } from "viem";

interface HeaderProps {
  safeAddress: string;
  chain: Chain;
  queueCount?: number;
  onClearConfig: () => void;
}

export const Header = ({ safeAddress, chain, queueCount = 0, onClearConfig }: HeaderProps) => {
  const location = useLocation();
  const navigateWithParams = useNavigateWithParams();
  const { guardAddress } = useStateContext();
  const isCreateActive = location.pathname.startsWith("/create");

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

      {/* Right section: CREATE | Safe | Wallet with dividers */}
      <CreateButton $isActive={isCreateActive} onClick={() => navigateWithParams("/create")}>
        CREATE
      </CreateButton>
      <HeaderSafeDropdown
        safeAddress={safeAddress}
        chain={chain}
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

// CREATE button with layer1 background for divider effect
const CreateButton = styled("button")<{ $isActive?: boolean }>(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 32px",
  background: canonHeaderTokens.background.layer1,
  border: "none",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.brand.green,
  "&:hover": {
    opacity: 0.8,
  },
}));
