import { useState } from "react";
import { Box, Typography, styled } from "@mui/material";
import { BoxIcon, PlusIcon, EllipsisIcon, ZapIcon, ZapOffIcon, CopyIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { getFactoryDisplayName } from "~/utils/factoryDisplay";
import { ActionMenu } from "./ActionMenu";
import type { Address } from "viem";

interface ActionItemProps {
  title: string;
  address: Address;
  factoryType: ActionFactoryType;
  isFastPath: boolean;
  onQueue?: () => void;
  onAddToQueue?: () => void;
  onRename?: () => void;
  onProposePreApproval?: () => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export const ActionItem = ({
  title,
  address,
  factoryType,
  isFastPath,
  onQueue,
  onAddToQueue,
  onRename,
  onProposePreApproval,
  onRemove,
  isRemoving,
}: ActionItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isUntitled = !title || title === "Untitled Transaction";
  const displayTitle = isUntitled ? "Untitled Transaction" : title;
  const factoryDisplayName = getFactoryDisplayName(factoryType);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
  };

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
      <IconSection>
        <BoxIcon size={20} color={canonHeaderTokens.foreground.accent20} />
      </IconSection>

      {/* Main content section */}
      <ContentSection>
        <ContentInner>
          <TitleSection>
            <Title $isUntitled={isUntitled}>{displayTitle}</Title>
            <AddressRow $isVisible={isHovered} onClick={handleCopyAddress}>
              <AddressText>{address}</AddressText>
              <CopyIconWrapper className='copy-icon'>
                <CopyIcon size={10} color={canonHeaderTokens.foreground.accent10} />
              </CopyIconWrapper>
            </AddressRow>
          </TitleSection>
          <TypeLabel>{factoryDisplayName}</TypeLabel>
        </ContentInner>
      </ContentSection>

      {/* Actions section */}
      <ActionsSection>
        <ActionsTop>
          <QueueButton onClick={onQueue}>
            <ButtonText>QUEUE</ButtonText>
            <PlusIcon size={14} color={canonHeaderTokens.foreground.accent10} />
          </QueueButton>
          <MoreButtonWrapper>
            <MoreButton onClick={handleMoreClick}>
              <EllipsisIcon size={16} color={canonHeaderTokens.foreground.accent10} />
            </MoreButton>
            <ActionMenu
              isOpen={isMenuOpen}
              onClose={handleMenuClose}
              onAddToQueue={onAddToQueue}
              onRename={onRename}
              onProposePreApproval={onProposePreApproval}
              onRemove={handleRemove}
              isRemoving={isRemoving}
            />
          </MoreButtonWrapper>
        </ActionsTop>
        <ActionsBottom>
          <PathIndicator $isFastPath={isFastPath}>
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
        </ActionsBottom>
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

const IconSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100px",
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "20px 24px",
  opacity: 0.8,
  borderRadius: "8px 0 0 8px",
});

const ContentSection = styled(Box)({
  flex: 1,
  display: "flex",
  alignItems: "center",
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "16px 20px",
  minWidth: 0,
});

const ContentInner = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
});

const TitleSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const Title = styled(Typography)<{ $isUntitled: boolean }>(({ $isUntitled }) => ({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: $isUntitled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent0,
}));

const AddressRow = styled(Box)<{ $isVisible: boolean }>(({ $isVisible }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  opacity: $isVisible ? 1 : 0,
  transition: "opacity 0.2s ease",
  pointerEvents: $isVisible ? "auto" : "none",
  cursor: "pointer",
  "&:hover": {
    "& .copy-icon": {
      opacity: 1,
    },
  },
}));

const AddressText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const CopyIconWrapper = styled("span")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.3,
  transition: "opacity 0.2s ease",
});

const TypeLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

const ActionsSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "space-between",
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "16px",
  minWidth: "200px",
  alignSelf: "stretch", // Ensure it fills parent height
  gap: "32px", // Minimum gap between buttons and path indicator
  borderRadius: "0 8px 8px 0",
});

const ActionsTop = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const QueueButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  height: "36px",
  padding: "8px 12px 8px 16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "100px",
  backgroundColor: "transparent",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const ButtonText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
});

const MoreButtonWrapper = styled(Box)({
  position: "relative",
});

const MoreButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "100px",
  backgroundColor: "transparent",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const ActionsBottom = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  justifyContent: "flex-end",
});

const PathIndicator = styled(Box)<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  display: "flex",
  alignItems: "center",
  gap: $isFastPath ? "6px" : "8px",
  justifyContent: "flex-end",
}));

const PathText = styled(Typography)<{ $isFastPath: boolean }>(({ $isFastPath }) => ({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isFastPath ? canonHeaderTokens.brand.green : canonHeaderTokens.status.red,
}));
