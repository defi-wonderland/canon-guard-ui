import { useState, useEffect } from "react";
import { KeyboardArrowDown } from "@mui/icons-material";
import { Box, styled } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Chain } from "viem/chains";
import { EmergencyModePanel } from "~/components/EmergencyModePanel";
import { ChainIcon, ChevronRightIcon, GripIcon, ShieldCheckIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import {
  DropdownMenuBackdrop,
  DropdownMenuDivider,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuItemLeft,
  DropdownMenuItemLabel,
} from "~/components/shared/DropdownComponents";
import { SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams, useCanonGuardConfig, useSafeStorage } from "~/hooks";
import { truncateAddress } from "~/utils";
import type { Address } from "viem";

interface HeaderSafeDropdownProps {
  safeAddress: string;
  chain: Chain;
  guardAddress: Address | null;
  onClearConfig: () => void;
}

export const HeaderSafeDropdown = ({ safeAddress, chain }: HeaderSafeDropdownProps) => {
  const navigate = useNavigate();
  const navigateWithParams = useNavigateWithParams();
  const { emergencyMode } = useCanonGuardConfig();
  const { savedSafesCount } = useSafeStorage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [emergencyPanelOpen, setEmergencyPanelOpen] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleButtonClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  const handleSettingsClick = () => {
    navigateWithParams("/settings");
    handleCloseMenu();
  };

  const handleEmergencyModeClick = () => {
    handleCloseMenu();
    setEmergencyPanelOpen(true);
  };

  const handleManageSafesClick = () => {
    navigate("/settings/safes");
    handleCloseMenu();
  };

  return (
    <DropdownWrapper data-testid='header-safe-dropdown'>
      <DropdownButton onClick={handleButtonClick} data-testid='header-safe-dropdown-button'>
        <DropdownContent>
          <DropdownRow>
            <DropdownLabel>Safe</DropdownLabel>
            <DropdownValue>{truncateAddress(safeAddress)}</DropdownValue>
            <ChevronIcon />
          </DropdownRow>
          <NetworkRow>
            <ChainIcon chainId={chain.id as SupportedChainId} size={14} />
            <NetworkLabel>{chain.name}</NetworkLabel>
          </NetworkRow>
        </DropdownContent>
      </DropdownButton>

      {/* Backdrop to close menu */}
      {menuOpen && <DropdownMenuBackdrop onClick={handleCloseMenu} />}

      {/* Custom dropdown menu */}
      <DropdownMenu $isOpen={menuOpen} data-testid='safe-dropdown-menu'>
        {/* Safe Profile Section */}
        <SafeProfileSection>
          <SafeProfileContent>
            <SafeIconWrapper>
              <ShieldCheckIcon size={16} color={canonHeaderTokens.foreground.accent0} />
            </SafeIconWrapper>
            <SafeProfileInfo>
              <SafeAddressRow>
                <SafeLabel>Safe</SafeLabel>
                <CopyableText text={safeAddress} iconSize={10} iconColor={canonHeaderTokens.foreground.accent30}>
                  <AddressText>{truncateAddress(safeAddress)}</AddressText>
                </CopyableText>
              </SafeAddressRow>
              <ChainRow>
                <ChainIcon chainId={chain.id as SupportedChainId} size={14} />
                <ChainName>{chain.name}</ChainName>
              </ChainRow>
            </SafeProfileInfo>
          </SafeProfileContent>
        </SafeProfileSection>

        <DropdownMenuDivider />

        {/* Settings */}
        <DropdownMenuItem onClick={handleSettingsClick} data-testid='settings-menu-item'>
          <DropdownMenuItemLeft>
            <ChevronRightIcon size={16} color={canonHeaderTokens.foreground.accent0} />
            <DropdownMenuItemLabel>Settings</DropdownMenuItemLabel>
          </DropdownMenuItemLeft>
        </DropdownMenuItem>

        <DropdownMenuDivider />

        {/* Emergency Mode */}
        <DropdownMenuItem onClick={handleEmergencyModeClick}>
          <DropdownMenuItemLeft>
            <ChevronRightIcon size={16} color={canonHeaderTokens.foreground.accent0} />
            <DropdownMenuItemLabel>Emergency Mode</DropdownMenuItemLabel>
          </DropdownMenuItemLeft>
          <EmergencyStatusIndicator>
            <StatusDot $isActive={emergencyMode === true} />
            <StatusText>{emergencyMode === true ? "ON" : "OFF"}</StatusText>
          </EmergencyStatusIndicator>
        </DropdownMenuItem>

        <DropdownMenuDivider />

        {/* Manage Safe Accounts */}
        <DropdownMenuItem onClick={handleManageSafesClick} data-testid='manage-safes-menu-item'>
          <DropdownMenuItemLeft>
            <GripIcon size={16} color={canonHeaderTokens.foreground.accent0} />
            <DropdownMenuItemLabel>
              Manage Safe Accounts{savedSafesCount > 0 ? ` (${savedSafesCount})` : ""}
            </DropdownMenuItemLabel>
          </DropdownMenuItemLeft>
        </DropdownMenuItem>
      </DropdownMenu>

      {/* Emergency Mode Panel */}
      <EmergencyModePanel
        isOpen={emergencyPanelOpen}
        onClose={() => setEmergencyPanelOpen(false)}
        testIdPrefix='header'
      />
    </DropdownWrapper>
  );
};

// Wrapper ensures proper gap/divider behavior in flex parent
const DropdownWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "100%",
  background: canonHeaderTokens.background.layer1,
  position: "relative",
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
});

const DropdownRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const DropdownLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent10,
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

const NetworkRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const NetworkLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
});

// Safe Profile Section
const SafeProfileSection = styled(Box)({
  padding: "16px 20px",
});

const SafeProfileContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const SafeIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  padding: "16px",
  borderRadius: "12px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  border: `0.5px solid ${canonHeaderTokens.background.layer1Variation}`,
});

const SafeProfileInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const SafeAddressRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const SafeLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const ChainRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const ChainName = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

// Emergency Mode Status
const EmergencyStatusIndicator = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const StatusDot = styled("div", {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive }) => ({
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  backgroundColor: $isActive ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent20,
}));

const StatusText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});
