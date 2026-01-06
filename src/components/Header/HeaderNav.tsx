import { Box, styled } from "@mui/material";
import { useLocation } from "react-router-dom";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams } from "~/hooks";

interface HeaderNavProps {
  queueCount?: number;
}

export const HeaderNav = ({ queueCount = 0 }: HeaderNavProps) => {
  const location = useLocation();
  const navigateWithParams = useNavigateWithParams();

  // Determine active route based on current path
  const isQueueActive = location.pathname === "/queue" || location.pathname === "/";
  const isCanonListActive = location.pathname === "/canon-list";

  return (
    <NavContainer>
      <NavItem $isActive={isQueueActive} onClick={() => navigateWithParams("/queue")}>
        QUEUE
        {queueCount > 0 && <QueueBadge>{queueCount}</QueueBadge>}
      </NavItem>
      <NavItem $isActive={isCanonListActive} onClick={() => navigateWithParams("/canon-list")}>
        CANON LIST
      </NavItem>
    </NavContainer>
  );
};

const NavContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "100%",
});

const NavItem = styled("button")<{ $isActive?: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "0 20px",
  background: "transparent",
  border: "none",
  borderBottom: $isActive ? `1px solid ${canonHeaderTokens.brand.green}` : "1px solid transparent",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent0,
  position: "relative",
  "&:hover": {
    opacity: 0.8,
  },
}));

const QueueBadge = styled("span")({
  marginLeft: "6px",
  fontSize: "10px",
  fontWeight: 600,
  color: canonHeaderTokens.brand.green,
});
