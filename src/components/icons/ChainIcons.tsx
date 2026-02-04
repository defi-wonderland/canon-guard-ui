/**
 * Chain Icon Components
 *
 * SVG icons for supported blockchain networks.
 * These match the chain configurations in ~/config/chains.ts
 */

import { Box, styled } from "@mui/material";
import { SupportedChainId, getChainConfig } from "~/config/chains";

interface ChainIconProps {
  size?: number;
  className?: string;
}

/**
 * Ethereum Mainnet Icon
 * Diamond shape representing ETH
 */
export const EthereumIcon = ({ size = 14, className }: ChainIconProps) => (
  <svg width={size} height={size} viewBox='0 0 14 14' fill='none' className={className}>
    <path d='M7 0L3 7L7 5.5L11 7L7 0Z' fill='#627EEA' />
    <path d='M7 14L3 8L7 6.5L11 8L7 14Z' fill='#627EEA' />
    <path d='M7 5.5L3 7L7 9L11 7L7 5.5Z' fill='#8A92B2' fillOpacity='0.6' />
  </svg>
);

/**
 * Optimism Icon
 * Red circle with OP logo
 */
export const OptimismIcon = ({ size = 14, className }: ChainIconProps) => (
  <svg width={size} height={size} viewBox='0 0 14 14' fill='none' className={className}>
    <rect width='14' height='14' rx='2' fill='#FF0420' />
    <path
      d='M4.2 9.8C3.7 9.8 3.3 9.65 3 9.35C2.7 9.05 2.55 8.65 2.55 8.15V5.85C2.55 5.35 2.7 4.95 3 4.65C3.3 4.35 3.7 4.2 4.2 4.2C4.7 4.2 5.1 4.35 5.4 4.65C5.7 4.95 5.85 5.35 5.85 5.85V8.15C5.85 8.65 5.7 9.05 5.4 9.35C5.1 9.65 4.7 9.8 4.2 9.8ZM4.2 8.9C4.4 8.9 4.55 8.83 4.67 8.7C4.78 8.57 4.85 8.38 4.85 8.15V5.85C4.85 5.62 4.78 5.43 4.67 5.3C4.55 5.17 4.4 5.1 4.2 5.1C4 5.1 3.85 5.17 3.73 5.3C3.62 5.43 3.55 5.62 3.55 5.85V8.15C3.55 8.38 3.62 8.57 3.73 8.7C3.85 8.83 4 8.9 4.2 8.9Z'
      fill='white'
    />
    <path
      d='M7.1 9.7V4.3H8.8C9.3 4.3 9.7 4.43 10 4.7C10.3 4.97 10.45 5.33 10.45 5.8C10.45 6.27 10.3 6.63 10 6.9C9.7 7.17 9.3 7.3 8.8 7.3H8.1V9.7H7.1ZM8.1 6.4H8.7C8.9 6.4 9.05 6.35 9.15 6.25C9.25 6.15 9.3 6 9.3 5.8C9.3 5.6 9.25 5.45 9.15 5.35C9.05 5.25 8.9 5.2 8.7 5.2H8.1V6.4Z'
      fill='white'
    />
  </svg>
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

export const ChainIcon = ({ chainId, size = 14, className }: ChainIconByIdProps) => {
  switch (chainId) {
    case SupportedChainId.ETHEREUM:
      return <EthereumIcon size={size} className={className} />;
    case SupportedChainId.OPTIMISM:
      return <OptimismIcon size={size} className={className} />;
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
