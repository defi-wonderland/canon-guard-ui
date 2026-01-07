import type { ReactNode } from "react";
import { Box, Typography, styled } from "@mui/material";
import { Info as InfoIcon, Plus as PlusIcon, X as XIcon } from "lucide-react";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

/**
 * Shared styled components for multi-item forms (Transfers, Arbitrary Actions, Hub Tokens).
 * These components provide a consistent UI pattern for adding/removing multiple items.
 */

// Main card container for multi-item sections
export const ItemsCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  overflow: "hidden",
});

// Wrapper for a single item - handles hover state for remove button
export const ItemSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  "&:hover .remove-button": {
    opacity: 1,
  },
});

// Divider header between items with label and remove button
interface ItemDividerHeaderProps {
  label: string;
  showRemove?: boolean;
  onRemove?: () => void;
}

export const ItemDividerHeader = ({ label, showRemove = false, onRemove }: ItemDividerHeaderProps) => {
  return (
    <DividerHeaderContainer>
      <ItemLabel>{label}</ItemLabel>
      {showRemove && onRemove && (
        <RemoveButton className='remove-button' onClick={onRemove}>
          <RemoveText>REMOVE</RemoveText>
          <XIcon size={12} color={canonHeaderTokens.foreground.accent20} />
        </RemoveButton>
      )}
    </DividerHeaderContainer>
  );
};

const DividerHeaderContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
});

const ItemLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

const RemoveButton = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  opacity: 0,
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.7,
  },
});

const RemoveText = styled(Typography)({
  fontSize: "11px",
  fontWeight: 400,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent20,
  textTransform: "uppercase",
});

// Container for form fields within an item
export const ItemFieldsSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

// Info row with add button at the bottom
interface AddItemRowProps {
  infoText: string;
  addButtonText: string;
  onAdd: () => void;
}

export const AddItemRow = ({ infoText, addButtonText, onAdd }: AddItemRowProps) => {
  return (
    <InfoRowContainer>
      <InfoContent>
        <InfoIcon size={16} color={canonHeaderTokens.foreground.accent30} />
        <InfoText>{infoText}</InfoText>
      </InfoContent>
      <AddButton onClick={onAdd}>
        <AddButtonText>{addButtonText}</AddButtonText>
        <PlusIcon size={14} color={canonHeaderTokens.foreground.accent10} />
      </AddButton>
    </InfoRowContainer>
  );
};

const InfoRowContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
});

const InfoContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const InfoText = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

const AddButton = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.7,
  },
});

const AddButtonText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
  letterSpacing: "0.6px",
});

// Action buttons row with dashed border at bottom
interface ActionButtonRowProps {
  children: ReactNode;
}

export const ActionButtonRow = ({ children }: ActionButtonRowProps) => {
  return <ActionButtonRowContainer>{children}</ActionButtonRowContainer>;
};

const ActionButtonRowContainer = styled(Box)({
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

export const ButtonsContainer = styled(Box)({
  display: "flex",
  gap: "16px",
  width: "100%",
});
