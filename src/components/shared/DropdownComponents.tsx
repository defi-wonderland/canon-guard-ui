import { Box, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

export const DropdownMenuBackdrop = styled("div")({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
});

export const DropdownMenuDivider = styled("div")({
  width: "100%",
  height: "0.5px",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});

export const DropdownMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isOpen",
})<{ $isOpen: boolean }>(({ $isOpen }) => ({
  position: "absolute",
  top: "78px",
  right: 0,
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

export const DropdownMenuItem = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "16px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer0,
  },
});

export const DropdownMenuItemLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

export const DropdownMenuItemLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});
