import { styled, Box, Tooltip, tooltipClasses, useMediaQuery } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import type { TooltipProps } from "@mui/material";

/**
 * Styled tooltip with consistent dark theme styling
 * Use this across the app for all tooltips
 */
export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => {
  const isTouchDevice = useMediaQuery("(pointer: coarse)");
  const resolvedPlacement = isTouchDevice ? "bottom" : props.placement;

  return (
    <Tooltip
      {...props}
      placement={resolvedPlacement}
      classes={{ popper: className }}
      PopperProps={{
        ...props.PopperProps,
        modifiers: [
          {
            name: "preventOverflow",
            options: {
              boundary: "viewport",
              padding: 12,
              altAxis: true,
              tether: true,
            },
          },
          {
            name: "flip",
            options: {
              fallbackPlacements: ["bottom", "top", "right", "left"],
            },
          },
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
          ...(props.PopperProps?.modifiers || []),
        ],
      }}
      enterTouchDelay={props.enterTouchDelay ?? 0}
      leaveTouchDelay={props.leaveTouchDelay ?? 3000}
    />
  );
})({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#37373e",
    color: "#b5b5b7",
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: "20px",
    padding: "12px 16px",
    borderRadius: "6px",
    maxWidth: "min(347px, calc(100vw - 24px))",
    overflowWrap: "anywhere",
    boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)",
  },
});

// Page container with vertical flex layout (header + content)
export const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

// ============================================
// Setup Flow Layout Components
// ============================================

/**
 * Header bar for setup screens (72px height, layer1 background)
 */
export const SetupHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "72px",
  backgroundColor: canonHeaderTokens.background.layer1,
  width: "100%",
  justifyContent: "space-between",
});

/**
 * Centered content area for setup screens
 */
export const SetupContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 24px 64px",
});

/**
 * Form wrapper with max-width constraint (576px)
 */
export const SetupFormWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  maxWidth: "576px",
});

/**
 * Section title for setup screens (uppercase, small text)
 */
export const SetupSectionTitle = styled("h2")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent30,
  padding: "8px",
  margin: 0,
});
