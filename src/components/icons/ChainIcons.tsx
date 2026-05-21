/**
 * Chain Icon Components
 *
 * Icons for supported blockchain networks.
 * These match the chain configurations in ~/config/chains.ts
 */

import { Box, styled } from "@mui/material";
import { SupportedChainId, getChainConfig } from "~/config/chains";
import optimismIcon from "~/assets/OP Mainnet.svg";
import ethereumIcon from "~/assets/ethereum.png";

interface ChainIconProps {
  size?: number;
  className?: string;
}

/**
 * Ethereum Mainnet Icon
 */
export const EthereumIcon = ({ size = 14, className }: ChainIconProps) => (
  <ChainIconImage src={ethereumIcon} alt='Ethereum' width={size} height={size} className={className} />
);

/**
 * Optimism Icon
 */
export const OptimismIcon = ({ size = 14, className }: ChainIconProps) => (
  <ChainIconImage src={optimismIcon} alt='Optimism' width={size} height={size} className={className} />
);

/**
 * Ink Chain Icon
 * Purple background with ink drop
 */
export const InkIcon = ({ size = 14, className }: ChainIconProps) => (
  <svg width={size} height={size} viewBox='0 0 14 14' fill='none' className={className}>
    <rect width='14' height='14' rx='2' fill='#7132F5' />
    <path d='M7 3C7 3 4.5 6.5 4.5 8.5C4.5 9.88 5.62 11 7 11C8.38 11 9.5 9.88 9.5 8.5C9.5 6.5 7 3 7 3Z' fill='white' />
  </svg>
);

/**
 * Generic chain icon component that renders the appropriate icon based on chainId
 */
interface ChainIconByIdProps extends ChainIconProps {
  chainId: SupportedChainId;
}

/**
 * Sepolia Testnet Icon - Ethereum icon with a testnet indicator
 */
export const SepoliaIcon = ({ size = 14, className }: ChainIconProps) => (
  <ChainIconImage
    src={ethereumIcon}
    alt='Sepolia'
    width={size}
    height={size}
    className={className}
    style={{ filter: "hue-rotate(200deg) saturate(0.7)" }}
  />
);

export const ChainIcon = ({ chainId, size = 14, className }: ChainIconByIdProps) => {
  switch (chainId) {
    case SupportedChainId.ETHEREUM:
      return <EthereumIcon size={size} className={className} />;
    case SupportedChainId.OPTIMISM:
      return <OptimismIcon size={size} className={className} />;
    case SupportedChainId.SEPOLIA:
      return <SepoliaIcon size={size} className={className} />;
    default: {
      // Fallback to a colored circle based on chain config
      const config = getChainConfig(chainId);
      return <FallbackChainIcon size={size} color={config?.iconColor || "#858589"} className={className} />;
    }
  }
};

/**
 * Fallback icon for chains without custom icons
 */
const FallbackChainIcon = ({ size = 14, color, className }: ChainIconProps & { color: string }) => (
  <svg width={size} height={size} viewBox='0 0 14 14' fill='none' className={className}>
    <rect width='14' height='14' rx='2' fill={color} />
    <circle cx='7' cy='7' r='3' fill='white' fillOpacity='0.8' />
  </svg>
);

/**
 * Chain badge component - shows icon + chain name
 */
interface ChainBadgeProps {
  chainId: SupportedChainId;
  size?: number;
}

export const ChainBadge = ({ chainId, size = 14 }: ChainBadgeProps) => {
  const config = getChainConfig(chainId);

  return (
    <ChainBadgeWrapper>
      <ChainIcon chainId={chainId} size={size} />
      <ChainBadgeName>{config?.shortName || config?.name || "Unknown"}</ChainBadgeName>
    </ChainBadgeWrapper>
  );
};

const ChainBadgeWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const ChainBadgeName = styled("span")(({ theme }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: theme.palette.mode === "dark" ? "#858589" : "#505057",
}));

const ChainIconImage = styled("img")({
  display: "block",
  objectFit: "contain",
});
