import { useState, useRef } from "react";
import { Box, Typography, styled } from "@mui/material";
import {
  BoxIcon,
  PlusIcon,
  EllipsisIcon,
  ZapIcon,
  ZapOffIcon,
  VectorSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { getFactoryDisplayName, getHubDisplayName } from "~/utils/factoryDisplay";
import { ActionMenu } from "./ActionMenu";
import type { Address } from "viem";

interface ActionItemProps {
  title: string;
  address: Address;
  factoryType: ActionFactoryType;
  isFastPath: boolean;
  // Hub-related props
  isHub?: boolean;
  isHubChild?: boolean;
  childrenCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  // Actions
  onQueue?: () => void;
  onAddToQueue?: () => void;
  onRename?: () => void;
  onProposePreApproval?: () => void;
  onDeployChild?: () => void;
  onRemove?: () => void;
  onTitleClick?: () => void;
  isRemoving?: boolean;
  // Signer status (for controlling action visibility/availability)
  isConnected?: boolean;
  isSigner?: boolean;
}

export const ActionItem = ({
  title,
  address,
  factoryType,
  isFastPath,
  isHub = false,
  isHubChild = false,
  childrenCount = 0,
  isExpanded = false,
  onToggleExpand,
  onQueue,
  onAddToQueue,
  onRename,
  onProposePreApproval,
  onDeployChild,
  onRemove,
  onTitleClick,
  isRemoving,
  isConnected = true,
  isSigner = true,
}: ActionItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const isUntitled = !title || title === "Untitled Transaction";
  const displayTitle = isUntitled ? "Untitled Transaction" : title;
  // Use hub display name for hubs, factory display name for others
  const factoryDisplayName = isHub ? `HUB: ${getHubDisplayName(factoryType)}` : getFactoryDisplayName(factoryType);

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleRemove = () => {
    onRemove?.();
    // Don't close menu immediately - let the loading state show
  };

  return (
    <ItemContainer onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Left icon section */}
      <IconSection $isHubChild={isHubChild} $isClickable={!!onTitleClick} onClick={onTitleClick}>
        {isHub ? (
          <VectorSquareIcon size={20} color={canonHeaderTokens.foreground.accent10} />
        ) : (
          <BoxIcon size={20} color={canonHeaderTokens.foreground.accent20} />
        )}
      </IconSection>

      {/* Main content section */}
      <ContentSection $isHubChild={isHubChild}>
        <ContentInner $isHubChild={isHubChild}>
          <TitleSection>
            <Title $isUntitled={isUntitled} $isClickable={!!onTitleClick} onClick={onTitleClick}>
              {displayTitle}
            </Title>
            {/* Hub children always show address; others show on hover */}
            <AddressRow $isVisible={isHubChild || isHovered}>
              <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
                <AddressText>{address}</AddressText>
              </CopyableText>
            </AddressRow>
          </TitleSection>
          {/* Hub children don't show type label */}
          {!isHubChild && <TypeLabel>{factoryDisplayName}</TypeLabel>}
        </ContentInner>
      </ContentSection>

      {/* Actions section */}
      <ActionsSection $isHubChild={isHubChild}>
        <ActionsTop>
          {/* Hubs show styled children count button */}
          {isHub ? (
            <ChildrenButton onClick={onToggleExpand}>
              <ChildrenButtonContent>
                <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                <ChildrenCountText>{childrenCount}</ChildrenCountText>
              </ChildrenButtonContent>
              {isExpanded ? (
                <ChevronUpIcon size={14} color={canonHeaderTokens.foreground.accent10} />
              ) : (
                <ChevronDownIcon size={14} color={canonHeaderTokens.foreground.accent10} />
              )}
            </ChildrenButton>
          ) : (
            /* Both regular actions and hub children show QUEUE button - hidden if disconnected */
            isConnected && (
              <StyledTooltip
                title={!isSigner ? "Connected wallet is not a signer" : ""}
                placement='top'
                disableHoverListener={isSigner}
              >
                <span>
                  <QueueButton
                    onClick={isSigner ? (isHubChild ? onAddToQueue : onQueue) : undefined}
                    data-testid='canon-list-queue-button'
                    disabled={!isSigner}
                  >
                    <ButtonText $disabled={!isSigner}>QUEUE</ButtonText>
                    <PlusIcon
                      size={14}
                      color={!isSigner ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent10}
                    />
                  </QueueButton>
                </span>
              </StyledTooltip>
            )
          )}
          {/* More button (ActionMenu) - hidden if disconnected */}
          {isConnected && (
            <MoreButtonWrapper>
              <StyledTooltip
                title={!isSigner ? "Connected wallet is not a signer" : ""}
                placement='top'
                disableHoverListener={isSigner}
              >
                <span>
                  <MoreButton ref={moreButtonRef} onClick={isSigner ? handleMoreClick : undefined} disabled={!isSigner}>
                    <EllipsisIcon
                      size={16}
                      color={!isSigner ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent10}
                    />
                  </MoreButton>
                </span>
              </StyledTooltip>
              <ActionMenu
                isOpen={isMenuOpen}
                onClose={handleMenuClose}
                isHub={isHub}
                isHubChild={isHubChild}
                isFastPath={isFastPath}
                triggerRef={moreButtonRef}
                onAddToQueue={onAddToQueue}
                onRename={onRename}
                onProposePreApproval={onProposePreApproval}
                onDeployChild={onDeployChild}
                onRemove={handleRemove}
                isRemoving={isRemoving}
              />
            </MoreButtonWrapper>
          )}
        </ActionsTop>
        {/* Hub children don't show Fast/Slow path - only hubs and regular actions show that */}
        {!isHubChild && (
          <ActionsBottom>
            <StyledTooltip
              title={
                isFastPath
                  ? "This action is pre-approved and will follow the fast-path with a shorter delay."
                  : "This action requires signatures and will follow the slow-path with a longer delay."
              }
              placement='top'
            >
              <PathIndicator
                $isFastPath={isFastPath}
                data-testid={isFastPath ? "fast-path-indicator" : "slow-path-indicator"}
              >
                {isFastPath ? (
                  <>
                    <ZapIcon size={12} color={canonHeaderTokens.brand.green} />
                    <PathText $isFastPath={isFastPath}>Fast-path</PathText>
                  </>
                ) : (
                  <>
                    <ZapOffIcon size={12} color={canonHeaderTokens.status.red} />
                    <PathText $isFastPath={isFastPath}>Slow-path</PathText>
                  </>
                )}
              </PathIndicator>
            </StyledTooltip>
          </ActionsBottom>
        )}
      </ActionsSection>
    </ItemContainer>
  );
};

const ItemContainer = styled(Box)({
  display: "flex",
  alignItems: "stretch", // Makes all children fill full height
  borderRadius: "8px",
  width: "100%",
  position: "relative", // For dropdown positioning
});

const IconSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isHubChild" && prop !== "$isClickable",
})<{ $isHubChild?: boolean; $isClickable?: boolean }>(({ $isHubChild, $isClickable }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: $isHubChild ? "80px" : "100px",
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: $isHubChild ? "16px 20px" : "20px 24px",
  opacity: 0.8,
  borderRadius: "8px 0 0 8px",
  cursor: $isClickable ? "pointer" : "default",
}));

const ContentSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isHubChild",
})<{ $isHubChild?: boolean }>(({ $isHubChild }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: $isHubChild ? "12px 20px" : "16px 20px",
  minWidth: 0,
}));

const ContentInner = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isHubChild",
})<{ $isHubChild?: boolean }>(({ $isHubChild }) => ({
  display: "flex",
  flexDirection: "column",
  gap: $isHubChild ? "8px" : "24px",
}));

const TitleSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const Title = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "$isUntitled" && prop !== "$isClickable",
})<{ $isUntitled: boolean; $isClickable?: boolean }>(({ $isUntitled, $isClickable }) => ({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: $isUntitled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent0,
  cursor: $isClickable ? "pointer" : "default",
  width: "fit-content",
  "&:hover": $isClickable
    ? {
        textDecoration: "underline",
        textDecorationColor: canonHeaderTokens.foreground.accent30,
        textUnderlineOffset: "3px",
      }
    : {},
}));

const AddressRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isVisible",
})<{ $isVisible: boolean }>(({ $isVisible }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  opacity: $isVisible ? 1 : 0,
  transition: "opacity 0.2s ease",
  pointerEvents: $isVisible ? "auto" : "none",
}));

const AddressText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const TypeLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

const ActionsSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isHubChild",
})<{ $isHubChild?: boolean }>(({ $isHubChild }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "space-between",
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: $isHubChild ? "12px" : "16px",
  minWidth: $isHubChild ? "150px" : "200px",
  alignSelf: "stretch", // Ensure it fills parent height
  gap: "32px", // Minimum gap between buttons and path indicator
  borderRadius: "0 8px 8px 0",
}));

// Styled pill button for children count (matches Figma design)
const ChildrenButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  height: "36px",
  padding: "8px 12px 8px 16px",
  border: "none",
  borderRadius: "100px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});

const ChildrenButtonContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "40px",
});

const ChildrenCountText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
});

const ActionsTop = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const QueueButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  height: "36px",
  padding: "8px 12px 8px 16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "100px",
  backgroundColor: "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: disabled ? "transparent" : canonHeaderTokens.background.layer1Variation,
  },
}));

const ButtonText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "$disabled",
})<{ $disabled?: boolean }>(({ $disabled }) => ({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: $disabled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent10,
}));

const MoreButtonWrapper = styled(Box)({
  position: "relative",
});

const MoreButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "100px",
  backgroundColor: "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: disabled ? "transparent" : canonHeaderTokens.background.layer1Variation,
  },
}));

const ActionsBottom = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  justifyContent: "flex-end",
});

const PathIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  display: "flex",
  alignItems: "center",
  gap: $isFastPath ? "6px" : "8px",
  justifyContent: "flex-end",
}));

const PathText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "$isFastPath",
})<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isFastPath ? canonHeaderTokens.brand.green : canonHeaderTokens.status.red,
}));
