import { useState, useCallback, useRef, ReactNode } from "react";
import { Box, styled, keyframes } from "@mui/material";
import { CopyIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface CopyableTextProps {
  text: string;
  children: ReactNode;
  iconSize?: number;
  iconColor?: string;
  className?: string;
}

/**
 * CopyableText - Wraps text content with copy functionality
 * Clicking anywhere on the text or icon copies to clipboard
 * Shows a "Copied!" tooltip above the icon
 */
export const CopyableText = ({
  text,
  children,
  iconSize = 10,
  iconColor = canonHeaderTokens.foreground.accent30,
  className,
}: CopyableTextProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);

      // Clear any existing timeout to prevent early dismissal
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setShowTooltip(true);
      timeoutRef.current = setTimeout(() => setShowTooltip(false), 1000);
    },
    [text],
  );

  return (
    <CopyableWrapper className={className} onClick={handleCopy}>
      <TextContent className='copyable-content'>{children}</TextContent>
      <IconWrapper>
        <IconInner className='copyable-content'>
          <CopyIcon size={iconSize} color={iconColor} />
        </IconInner>
        {showTooltip && (
          <Tooltip>
            <TooltipText>Copied!</TooltipText>
            <TooltipArrow />
          </Tooltip>
        )}
      </IconWrapper>
    </CopyableWrapper>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

const CopyableWrapper = styled(Box)({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  "&:hover": {
    "& .copyable-content": {
      opacity: 0.7,
    },
  },
});

const TextContent = styled("span")({
  display: "inline",
  transition: "opacity 0.15s ease",
});

const IconWrapper = styled(Box)({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const IconInner = styled(Box)({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.15s ease",
});

const Tooltip = styled(Box)({
  position: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginBottom: "6px",
  animation: `${fadeIn} 0.15s ease-out`,
  zIndex: 10000,
  opacity: 1,
});

const TooltipText = styled("span")({
  display: "block",
  padding: "4px 8px",
  backgroundColor: canonHeaderTokens.background.layer1,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "4px",
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 500,
  color: canonHeaderTokens.brand.green,
  whiteSpace: "nowrap",
});

const TooltipArrow = styled(Box)({
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 0,
  height: 0,
  borderLeft: "5px solid transparent",
  borderRight: "5px solid transparent",
  borderTop: `5px solid ${canonHeaderTokens.foreground.accent40}`,
});
