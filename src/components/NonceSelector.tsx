/**
 * NonceSelector Component
 *
 * Allows users to select which Safe nonce to sign a transaction at.
 * Shows existing queued transactions per nonce and highlights the recommended nonce.
 */

import { useMemo } from "react";
import { styled, Box, Typography, Select, MenuItem, SelectChangeEvent, alpha } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { QueueItem } from "~/services/queueService";

/**
 * Represents a nonce option in the dropdown
 */
export interface NonceOption {
  nonce: number;
  label?: string; // Label of the transaction at this nonce (if any)
  isRecommended: boolean;
  isUsed: boolean; // Whether there's already a transaction at this nonce
  approversCount?: number; // Number of signers for existing tx
  threshold?: number; // Safe threshold for existing tx
}

export interface NonceSelectorProps {
  /** Current Safe nonce (minimum selectable) */
  currentNonce: number;
  /** Recommended nonce (next available after queue) */
  recommendedNonce: number;
  /** Currently selected nonce */
  selectedNonce: number;
  /** Callback when nonce changes */
  onNonceChange: (nonce: number) => void;
  /** If true, the nonce is locked and cannot be changed */
  isReadOnly?: boolean;
  /** Queue items to show in dropdown */
  queueItems?: QueueItem[];
  /** Maximum future nonce to show (defaults to recommended + 5) */
  maxFutureNonces?: number;
}

// Styled components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "16px",
});

const Label = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
  padding: "8px",
});

const StyledSelect = styled(Select<number>)(() => ({
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  color: canonHeaderTokens.foreground.accent0,
  width: "fit-content",
  minWidth: "100px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: `${alpha(canonHeaderTokens.foreground.accent10, 0.3)}`,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: canonHeaderTokens.foreground.accent10,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: `${alpha(canonHeaderTokens.foreground.accent10, 0.3)}`,
  },
  "& .MuiSelect-icon": {
    color: canonHeaderTokens.foreground.accent10,
  },
}));

const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: (prop) => prop !== "isRecommended" && prop !== "isUsed",
})<{ isRecommended?: boolean; isUsed?: boolean }>(({ isRecommended }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "10px 16px",
  backgroundColor: isRecommended ? alpha(canonHeaderTokens.brand.green, 0.1) : "transparent",
  "&:hover": {
    backgroundColor: isRecommended
      ? alpha(canonHeaderTokens.brand.green, 0.15)
      : alpha(canonHeaderTokens.foreground.accent10, 0.1),
  },
  "&.Mui-selected": {
    backgroundColor: isRecommended
      ? alpha(canonHeaderTokens.brand.green, 0.2)
      : alpha(canonHeaderTokens.foreground.accent10, 0.15),
    "&:hover": {
      backgroundColor: isRecommended
        ? alpha(canonHeaderTokens.brand.green, 0.25)
        : alpha(canonHeaderTokens.foreground.accent10, 0.2),
    },
  },
}));

const NonceNumber = styled(Typography)({
  fontFamily: "monospace",
  fontSize: "14px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent0,
});

const TxLabel = styled(Typography)({
  fontSize: "13px",
  color: canonHeaderTokens.foreground.accent10,
  marginLeft: "12px",
  maxWidth: "200px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const RecommendedBadge = styled(Box)({
  backgroundColor: alpha(canonHeaderTokens.brand.green, 0.2),
  color: canonHeaderTokens.brand.green,
  fontSize: "10px",
  fontWeight: 600,
  padding: "2px 6px",
  borderRadius: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  flexShrink: 0,
});

const ReadOnlyText = styled(Typography)({
  fontFamily: "monospace",
  fontSize: "14px",
  fontWeight: 500,
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer1,
  padding: "12px 16px",
  borderRadius: "8px",
  border: `1px solid ${alpha(canonHeaderTokens.foreground.accent10, 0.3)}`,
});

/**
 * Build nonce options from queue items
 * When multiple txs exist for same nonce, picks the one with most signatures (tie-breaker: earliest executableAt)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function buildNonceOptions(
  currentNonce: number,
  recommendedNonce: number,
  queueItems: QueueItem[],
  maxFutureNonces: number = 5,
): NonceOption[] {
  // Filter to only include items with at least 1 signature
  // Items with 0 signatures haven't been assigned a nonce yet (just queued, not signed)
  const signedItems = queueItems.filter((item) => item.approversCount > 0);

  // Group queue items by nonce
  const nonceToItems = new Map<number, QueueItem[]>();
  for (const item of signedItems) {
    const existing = nonceToItems.get(item.nonce) || [];
    existing.push(item);
    nonceToItems.set(item.nonce, existing);
  }

  // For each nonce with items, pick the best one (most signatures, then earliest executableAt)
  const nonceToItem = new Map<number, QueueItem>();
  for (const [nonce, items] of nonceToItems) {
    const sorted = items.sort((a, b) => {
      // First by approversCount descending
      if (b.approversCount !== a.approversCount) {
        return b.approversCount - a.approversCount;
      }
      // Then by executableAt ascending (earlier first)
      return a.executableAt.getTime() - b.executableAt.getTime();
    });
    nonceToItem.set(nonce, sorted[0]);
  }

  // Build options from currentNonce to recommended + maxFutureNonces
  const maxNonce = recommendedNonce + maxFutureNonces;
  const options: NonceOption[] = [];

  for (let nonce = currentNonce; nonce <= maxNonce; nonce++) {
    const existingItem = nonceToItem.get(nonce);
    options.push({
      nonce,
      label: existingItem?.label,
      isRecommended: nonce === recommendedNonce,
      isUsed: !!existingItem,
      approversCount: existingItem?.approversCount,
      threshold: existingItem?.threshold,
    });
  }

  return options;
}

/**
 * Calculate the recommended nonce
 * Finds the first available (empty) nonce starting from currentNonce
 * Only considers items with at least 1 signature as "occupied"
 */
// eslint-disable-next-line react-refresh/only-export-components
export function calculateRecommendedNonce(currentNonce: number, queueItems: QueueItem[]): number {
  // Get set of occupied nonces (only signed items count as occupying a nonce)
  const occupiedNonces = new Set(queueItems.filter((item) => item.approversCount > 0).map((item) => item.nonce));

  // Find first empty nonce starting from currentNonce
  let nonce = currentNonce;
  while (occupiedNonces.has(nonce)) {
    nonce++;
  }
  return nonce;
}

export function NonceSelector({
  currentNonce,
  recommendedNonce,
  selectedNonce,
  onNonceChange,
  isReadOnly = false,
  queueItems = [],
  maxFutureNonces = 5,
}: NonceSelectorProps) {
  const nonceOptions = useMemo(
    () => buildNonceOptions(currentNonce, recommendedNonce, queueItems, maxFutureNonces),
    [currentNonce, recommendedNonce, queueItems, maxFutureNonces],
  );

  const handleChange = (event: SelectChangeEvent<number>) => {
    onNonceChange(event.target.value as number);
  };

  // Find the selected option to display info
  const selectedOption = nonceOptions.find((opt) => opt.nonce === selectedNonce);

  if (isReadOnly) {
    return (
      <Container>
        <Label>Nonce</Label>
        <ReadOnlyText>
          # {selectedNonce}
          {selectedOption?.label && (
            <TxLabel as='span' style={{ marginLeft: "12px" }}>
              ({selectedOption.label})
            </TxLabel>
          )}
        </ReadOnlyText>
      </Container>
    );
  }

  return (
    <Container>
      <Label>Nonce</Label>
      <StyledSelect
        value={selectedNonce}
        onChange={handleChange}
        renderValue={(value) => <NonceNumber># {value}</NonceNumber>}
        MenuProps={{
          disableScrollLock: true,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          sx: {
            "& .MuiBackdrop-root": {
              opacity: "0 !important",
            },
          },
          PaperProps: {
            sx: {
              backgroundColor: canonHeaderTokens.background.layer1,
              border: `1px solid ${alpha(canonHeaderTokens.foreground.accent10, 0.3)}`,
              borderRadius: "8px",
              "& .MuiList-root": {
                padding: 0,
              },
            },
          },
        }}
      >
        {nonceOptions.map((option) => (
          <StyledMenuItem
            key={option.nonce}
            value={option.nonce}
            isRecommended={option.isRecommended}
            isUsed={option.isUsed}
          >
            <Box display='flex' alignItems='center'>
              <NonceNumber># {option.nonce}</NonceNumber>
              {option.isUsed && option.label && (
                <TxLabel>
                  {option.label}
                  {option.approversCount !== undefined &&
                    option.threshold !== undefined &&
                    ` (${option.approversCount}/${option.threshold} sigs)`}
                </TxLabel>
              )}
            </Box>
            {option.isRecommended && <RecommendedBadge>Recommended</RecommendedBadge>}
          </StyledMenuItem>
        ))}
      </StyledSelect>
    </Container>
  );
}

export default NonceSelector;
