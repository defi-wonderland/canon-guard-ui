import { useState } from "react";
import { styled } from "@mui/material";

interface TokenIconProps {
  logoURI?: string;
  symbol?: string;
  size?: number;
}

/**
 * Token icon component that renders a token logo image.
 * Falls back to a generic colored circle with the first letter of the symbol.
 */
export const TokenIcon = ({ logoURI, symbol, size = 20 }: TokenIconProps) => {
  const [hasError, setHasError] = useState(false);

  if (!logoURI || hasError) {
    return <FallbackIcon size={size} symbol={symbol} />;
  }

  return (
    <TokenImage
      src={logoURI}
      alt={symbol || "Token"}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      loading='lazy'
    />
  );
};

/** Fallback icon when no logo is available or the image fails to load */
const FallbackIcon = ({ size = 20, symbol }: { size?: number; symbol?: string }) => {
  const letter = symbol?.charAt(0)?.toUpperCase() || "?";
  const fontSize = Math.round(size * 0.5);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill='#505057' />
      <text
        x='50%'
        y='50%'
        dominantBaseline='central'
        textAnchor='middle'
        fill='white'
        fontSize={fontSize}
        fontFamily='Inter, sans-serif'
        fontWeight={600}
      >
        {letter}
      </text>
    </svg>
  );
};

const TokenImage = styled("img")({
  display: "block",
  objectFit: "contain",
  borderRadius: "50%",
});
