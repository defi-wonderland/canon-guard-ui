import { useRef, useEffect } from "react";
import { Box, styled } from "@mui/material";
import { CircleFadingPlusIcon, SquarePenIcon, ZapIcon, ZapOffIcon, TrashIcon, PlusIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isHub?: boolean;
  isHubChild?: boolean;
  isFastPath?: boolean;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onAddToQueue?: () => void;
  onRename?: () => void;
  onProposePreApproval?: () => void;
  onDeployChild?: () => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export const ActionMenu = ({
  isOpen,
  onClose,
  isHub = false,
  isHubChild = false,
  isFastPath = false,
  triggerRef,
  onAddToQueue,
  onRename,
  onProposePreApproval,
  onDeployChild,
  onRemove,
  isRemoving,
}: ActionMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (but not on the trigger button)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Ignore clicks on the menu itself
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      // Ignore clicks on the trigger button (let the toggle handler handle it)
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return;
      }
      onClose();
    };

    if (isOpen) {
      // Add a small delay to prevent immediate close from the same click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Hub menu: Rename, Propose Pre-Approval, Deploy Child, Remove Hub
  if (isHub) {
    return (
      <MenuContainer ref={menuRef}>
        <MenuItem onClick={onRename}>
          <SquarePenIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          <MenuItemText>Rename</MenuItemText>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onProposePreApproval}>
          {isFastPath ? (
            <ZapOffIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          ) : (
            <ZapIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          )}
          <MenuItemText>{isFastPath ? "Remove pre-approval" : "Pre-Approve"}</MenuItemText>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onDeployChild}>
          <PlusIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          <MenuItemText data-testid='deploy-child-menu-item'>Deploy Child</MenuItemText>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onRemove} disabled={isRemoving}>
          <TrashIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          <MenuItemText>{isRemoving ? "Removing..." : "Remove Hub"}</MenuItemText>
        </MenuItem>
      </MenuContainer>
    );
  }

  // Hub child menu: Add to Queue, Rename (no remove, no pre-approval)
  if (isHubChild) {
    return (
      <MenuContainer ref={menuRef}>
        <MenuItem onClick={onAddToQueue}>
          <CircleFadingPlusIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          <MenuItemText>Add to Queue</MenuItemText>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onRename}>
          <SquarePenIcon size={16} color={canonHeaderTokens.foreground.accent0} />
          <MenuItemText>Rename</MenuItemText>
        </MenuItem>
      </MenuContainer>
    );
  }

  // Regular action menu: Add to Queue, Rename, Pre-Approve, Remove
  return (
    <MenuContainer ref={menuRef}>
      <MenuItem onClick={onAddToQueue}>
        <CircleFadingPlusIcon size={16} color={canonHeaderTokens.foreground.accent0} />
        <MenuItemText>Add to Queue</MenuItemText>
      </MenuItem>
      <MenuDivider />
      <MenuItem onClick={onRename}>
        <SquarePenIcon size={16} color={canonHeaderTokens.foreground.accent0} />
        <MenuItemText>Rename</MenuItemText>
      </MenuItem>
      <MenuDivider />
      <MenuItem onClick={onProposePreApproval}>
        {isFastPath ? (
          <ZapOffIcon size={16} color={canonHeaderTokens.foreground.accent0} />
        ) : (
          <ZapIcon size={16} color={canonHeaderTokens.foreground.accent0} />
        )}
        <MenuItemText>{isFastPath ? "Remove pre-approval" : "Pre-Approve"}</MenuItemText>
      </MenuItem>
      <MenuDivider />
      <MenuItem onClick={onRemove} disabled={isRemoving}>
        <TrashIcon size={16} color={canonHeaderTokens.foreground.accent0} />
        <MenuItemText>{isRemoving ? "Removing..." : "Remove Action"}</MenuItemText>
      </MenuItem>
    </MenuContainer>
  );
};

const MenuContainer = styled(Box)({
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  width: "264px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "12px",
  border: `0.5px solid ${canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
  zIndex: 100,
});

const MenuItem = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  backgroundColor: "transparent",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  width: "100%",
  transition: "background-color 0.15s ease",
  "&:hover": {
    backgroundColor: disabled ? "transparent" : canonHeaderTokens.background.layer1Variation,
  },
}));

const MenuItemText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const MenuDivider = styled(Box)({
  height: "0.5px",
  width: "100%",
  backgroundColor: canonHeaderTokens.foreground.accent40,
});
