import { useState, useEffect, useCallback } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { Address } from "viem";
import { ActionDetailModal } from "~/components/ActionDetailModal";
import { SearchIcon, HelpCircleIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from "~/components/icons";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useCanonGuardConfig } from "~/hooks/useCanonGuardConfig";
import { useIsSigner } from "~/hooks/useIsSigner";
import { useNavigateWithParams } from "~/hooks/useNavigateWithParams";
import { useQueueService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { useTransactionExecutor } from "~/hooks/useTransactionExecutor";
import { useWallet } from "~/hooks/useWallet";
import { QueueItem as QueueItemType } from "~/services";
import { ActionFactoryType } from "~/types";
import { QueueItem } from "./QueueItem";

const ITEMS_PER_PAGE = 25;

interface QueueSectionProps {
  onQueueCountChange?: (count: number) => void;
}

export const QueueSection = ({ onQueueCountChange }: QueueSectionProps) => {
  const queueService = useQueueService();
  const { guardAddress, safeAddress, chainId } = useStateContext();
  const { executeCanonTransaction, executeCancelTransaction, isExecuting } = useTransactionExecutor();
  const navigateWithParams = useNavigateWithParams();
  const { address: connectedAddress } = useWallet();
  const isSigner = useIsSigner();
  const { emergencyMode, emergencyCaller, refetch: refetchConfig } = useCanonGuardConfig();

  const [queueItems, setQueueItems] = useState<QueueItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "in-review" | "signed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [executingItemAddress, setExecutingItemAddress] = useState<Address | null>(null);
  const [removingItemAddress, setRemovingItemAddress] = useState<Address | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Action detail modal state
  const [selectedItem, setSelectedItem] = useState<QueueItemType | null>(null);

  const fetchQueueItems = useCallback(async () => {
    if (!guardAddress || !safeAddress) return;

    setLoading(true);
    try {
      const items = await queueService.getQueueItems(guardAddress as Address, safeAddress as Address);
      console.log(`[QueueSection] Fetched queue items count: ${items.length}`);
      items.forEach((item, idx) => {
        console.log(
          `[QueueSection] Item ${idx}: ${JSON.stringify({
            label: item.label,
            nonce: item.nonce,
            currentNonce: item.currentNonce,
            isAtCurrentNonce: item.isAtCurrentNonce,
            approversCount: item.approversCount,
            threshold: item.threshold,
            isFullySigned: item.isFullySigned,
            isExecutable: item.isExecutable,
          })}`,
        );
      });
      setQueueItems(items);
      onQueueCountChange?.(items.length);
    } catch (error) {
      console.error("Failed to fetch queue items:", error);
    } finally {
      setLoading(false);
    }
  }, [queueService, guardAddress, safeAddress, onQueueCountChange]);

  useEffect(() => {
    fetchQueueItems();
  }, [fetchQueueItems]);

  // Filter items based on search and active filter
  const filteredItems = queueItems.filter((item) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesLabel = item.label?.toLowerCase().includes(query);
      const matchesAddress = item.actionBuilderAddress.toLowerCase().includes(query);
      if (!matchesLabel && !matchesAddress) return false;
    }

    // Status filter
    switch (activeFilter) {
      case "in-review":
        // Items with 0 signatures (need review)
        return item.approversCount === 0;
      case "signed":
        // Items with at least 1 signature
        return item.approversCount > 0;
      default:
        return true;
    }
  });

  // Group items into three sections (all items are now at current nonce):
  // 1. MISSING NONCE - items with 0 signatures (need to be signed)
  // 2. READY TO EXECUTE - items that are fully signed and executable
  // 3. WAITING FOR APPROVAL - items with some signatures but not fully signed
  // All sections sorted by nonce ascending (lowest nonce first = can execute first)
  const missingNonce = filteredItems.filter((item) => item.approversCount === 0).sort((a, b) => a.nonce - b.nonce);
  const readyToExecute = filteredItems.filter((item) => item.isFullySigned).sort((a, b) => a.nonce - b.nonce);
  const waitingForApproval = filteredItems
    .filter((item) => item.approversCount > 0 && !item.isFullySigned)
    .sort((a, b) => a.nonce - b.nonce);

  // Debug: log section counts
  console.log(
    `[QueueSection] Section counts: ${JSON.stringify({
      filteredItems: filteredItems.length,
      missingNonce: missingNonce.length,
      readyToExecute: readyToExecute.length,
      waitingForApproval: waitingForApproval.length,
    })}`,
  );

  // Pagination - count only items at current nonce
  const displayedItems = missingNonce.length + readyToExecute.length + waitingForApproval.length;
  const totalPages = Math.ceil(displayedItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, displayedItems);

  // Get counts for filter badges
  const allCount = queueItems.length;
  const inReviewCount = queueItems.filter((i) => i.approversCount === 0).length;
  const signedCount = queueItems.filter((i) => i.approversCount > 0).length;

  // Navigate to sign flow for the queue item
  const handleSign = useCallback(
    (item: QueueItemType) => {
      console.log("[QueueSection] Navigating to sign flow for:", item.label);
      navigateWithParams("/queue/sign", {
        state: {
          actionBuilderAddress: item.actionBuilderAddress,
          label: item.label || "Untitled Transaction",
          factoryLabel: item.factoryLabel || "Unknown",
          nonce: item.nonce,
          approversCount: item.approversCount,
          threshold: item.threshold,
        },
      });
    },
    [navigateWithParams],
  );

  const handleExecute = useCallback(
    async (item: QueueItemType) => {
      if (!guardAddress || isExecuting) return;

      setExecutingItemAddress(item.actionBuilderAddress);
      try {
        const result = await executeCanonTransaction(guardAddress as Address, item.actionBuilderAddress);

        if (result) {
          console.log("Transaction executed successfully:", result);

          // If this was a CHANGE_SAFE_GUARD action, refresh the page with correct params
          // to pick up the new guard state
          if (item.factoryType === ActionFactoryType.CHANGE_SAFE_GUARD) {
            // Build the new URL with safe params
            const params = new URLSearchParams();
            if (safeAddress) params.set("safeAddress", safeAddress);
            const chainIdParam = new URLSearchParams(window.location.search).get("chainId");
            if (chainIdParam) params.set("chainId", chainIdParam);

            // Do a full page reload to let SafeVault re-fetch Safe info
            window.location.href = `/queue?${params.toString()}`;
            return;
          }

          // Optimistically update local state:
          // 1. Remove the executed item
          // 2. Increment currentNonce for remaining items (Safe nonce has increased)
          // 3. Recalculate isAtCurrentNonce for remaining items
          // 4. Reset signature fields for stale nonce items (signatures are now invalid)
          setQueueItems((prev) => {
            const newCurrentNonce = item.currentNonce + 1;
            const updated = prev
              .filter((i) => i.actionBuilderAddress !== item.actionBuilderAddress)
              .map((i) => {
                const isStale = i.nonce < newCurrentNonce;
                return {
                  ...i,
                  currentNonce: newCurrentNonce,
                  isAtCurrentNonce: i.nonce === newCurrentNonce,
                  // Reset signature fields for stale items (signatures are invalid)
                  ...(isStale && {
                    approversCount: 0,
                    isFullySigned: false,
                  }),
                };
              });
            onQueueCountChange?.(updated.length);
            return updated;
          });
          // Refetch config to update emergency mode status if it changed
          await refetchConfig();
        }
      } catch (error) {
        console.error("Failed to execute transaction:", error);
      }
      setExecutingItemAddress(null);
    },
    [guardAddress, safeAddress, isExecuting, executeCanonTransaction, refetchConfig, onQueueCountChange],
  );

  const handleRemove = useCallback(
    async (item: QueueItemType) => {
      if (!guardAddress || isRemoving) return;

      setRemovingItemAddress(item.actionBuilderAddress);
      setIsRemoving(true);
      try {
        const result = await executeCancelTransaction(guardAddress as Address, item.actionBuilderAddress);

        if (result) {
          console.log("Transaction cancelled successfully:", result);
          // Optimistically remove from local state and update count
          setQueueItems((prev) => {
            const updated = prev.filter((i) => i.actionBuilderAddress !== item.actionBuilderAddress);
            onQueueCountChange?.(updated.length);
            return updated;
          });
        }
      } catch (error) {
        console.error("Failed to cancel transaction:", error);
      }
      setRemovingItemAddress(null);
      setIsRemoving(false);
    },
    [guardAddress, isRemoving, executeCancelTransaction, onQueueCountChange],
  );

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress sx={{ color: canonHeaderTokens.brand.green }} size={32} />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <ContentWrapper>
        {/* Title Section */}
        <TitleSection>
          <TitleRow>
            <Title data-testid='queue-title'>Queue</Title>
            <StyledTooltip
              title='View and manage pending transactions. Sign, execute, or remove transactions from the queue.'
              placement='right'
            >
              <HelpIconWrapper>
                <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
              </HelpIconWrapper>
            </StyledTooltip>
          </TitleRow>
        </TitleSection>

        {/* Search and Filter Bar */}
        <SearchFilterBar>
          <SearchSection>
            <SearchIcon size={16} color={canonHeaderTokens.foreground.accent0} />
            <SearchInput
              type='text'
              placeholder='Search by name or 0x...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid='queue-search-input'
            />
          </SearchSection>
          <FilterDivider />
          <FilterTab $isActive={activeFilter === "all"} onClick={() => setActiveFilter("all")} data-testid='filter-all'>
            <FilterLabel $isActive={activeFilter === "all"}>ALL</FilterLabel>
            <FilterCount $isActive={activeFilter === "all"}>{allCount}</FilterCount>
          </FilterTab>
          <FilterDivider />
          <FilterTab
            $isActive={activeFilter === "in-review"}
            onClick={() => setActiveFilter("in-review")}
            data-testid='filter-in-review'
          >
            <FilterLabel $isActive={activeFilter === "in-review"}>IN REVIEW</FilterLabel>
            <FilterCount $isActive={activeFilter === "in-review"}>{inReviewCount}</FilterCount>
          </FilterTab>
          <FilterDivider />
          <FilterTab
            $isActive={activeFilter === "signed"}
            onClick={() => setActiveFilter("signed")}
            data-testid='filter-signed'
          >
            <FilterLabel $isActive={activeFilter === "signed"}>SIGNED</FilterLabel>
            <FilterCount $isActive={activeFilter === "signed"}>{signedCount}</FilterCount>
          </FilterTab>
        </SearchFilterBar>

        {/* Queue Items */}
        <QueueItemsContainer>
          {/* Missing Nonce (0 signatures at current nonce) */}
          {missingNonce.length > 0 && (
            <SectionGroup data-testid='missing-nonce-section'>
              <SectionHeader>
                <SectionTitle>MISSING NONCE</SectionTitle>
              </SectionHeader>
              <ItemsList>
                {missingNonce.map((item) => (
                  <QueueItem
                    key={`${item.actionBuilderAddress}-${item.nonce}`}
                    item={item}
                    connectedAddress={connectedAddress}
                    isSigner={isSigner}
                    emergencyMode={emergencyMode ?? false}
                    emergencyCaller={emergencyCaller}
                    onSign={() => handleSign(item)}
                    onExecute={() => handleExecute(item)}
                    onRemove={() => handleRemove(item)}
                    onTitleClick={() => setSelectedItem(item)}
                    isLoading={executingItemAddress === item.actionBuilderAddress && isExecuting}
                    isSignLoading={false}
                    isRemoveLoading={removingItemAddress === item.actionBuilderAddress && isRemoving}
                  />
                ))}
              </ItemsList>
            </SectionGroup>
          )}

          {/* Ready to Execute (fully signed) */}
          {readyToExecute.length > 0 && (
            <SectionGroup data-testid='ready-to-execute-section'>
              <SectionHeader>
                <SectionTitle>READY TO EXECUTE</SectionTitle>
              </SectionHeader>
              <ItemsList>
                {readyToExecute.map((item) => (
                  <QueueItem
                    key={`${item.actionBuilderAddress}-${item.nonce}`}
                    item={item}
                    connectedAddress={connectedAddress}
                    isSigner={isSigner}
                    emergencyMode={emergencyMode ?? false}
                    emergencyCaller={emergencyCaller}
                    onSign={() => handleSign(item)}
                    onExecute={() => handleExecute(item)}
                    onRemove={() => handleRemove(item)}
                    onTitleClick={() => setSelectedItem(item)}
                    isLoading={executingItemAddress === item.actionBuilderAddress && isExecuting}
                    isSignLoading={false}
                    isRemoveLoading={removingItemAddress === item.actionBuilderAddress && isRemoving}
                  />
                ))}
              </ItemsList>
            </SectionGroup>
          )}

          {/* Waiting for Approval (some signatures but not fully signed) */}
          {waitingForApproval.length > 0 && (
            <SectionGroup data-testid='waiting-approval-section'>
              <SectionHeader>
                <SectionTitle>WAITING FOR APPROVAL</SectionTitle>
              </SectionHeader>
              <ItemsList>
                {waitingForApproval.map((item) => (
                  <QueueItem
                    key={`${item.actionBuilderAddress}-${item.nonce}`}
                    item={item}
                    connectedAddress={connectedAddress}
                    isSigner={isSigner}
                    emergencyMode={emergencyMode ?? false}
                    emergencyCaller={emergencyCaller}
                    onSign={() => handleSign(item)}
                    onExecute={() => handleExecute(item)}
                    onRemove={() => handleRemove(item)}
                    onTitleClick={() => setSelectedItem(item)}
                    isLoading={executingItemAddress === item.actionBuilderAddress && isExecuting}
                    isSignLoading={false}
                    isRemoveLoading={removingItemAddress === item.actionBuilderAddress && isRemoving}
                  />
                ))}
              </ItemsList>
            </SectionGroup>
          )}

          {/* Empty State */}
          {missingNonce.length === 0 && readyToExecute.length === 0 && waitingForApproval.length === 0 && (
            <EmptyState>{searchQuery ? "No items match your search" : "No transactions in queue"}</EmptyState>
          )}

          {/* Pagination */}
          {displayedItems > 0 && (
            <PaginationRow>
              <PaginationInfo>
                Showing {startIndex + 1} - {endIndex} / {displayedItems}
              </PaginationInfo>
              <PaginationControls>
                <PaginationButton
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                </PaginationButton>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((page) => (
                  <PageNumber key={page} $isActive={currentPage === page} onClick={() => setCurrentPage(page)}>
                    {page}
                  </PageNumber>
                ))}
                {totalPages > 3 && (
                  <>
                    <EllipsisIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                    <PageNumber $isActive={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </PageNumber>
                  </>
                )}
                <PaginationButton
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                </PaginationButton>
              </PaginationControls>
            </PaginationRow>
          )}
        </QueueItemsContainer>
      </ContentWrapper>

      {/* Action Detail Modal */}
      {selectedItem && (
        <ActionDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          data={{ mode: "queue", item: selectedItem }}
          chainId={chainId}
          onSign={() => {
            setSelectedItem(null);
            handleSign(selectedItem);
          }}
          onExecute={async () => {
            await handleExecute(selectedItem);
            setSelectedItem(null);
          }}
          onRemove={async () => {
            await handleRemove(selectedItem);
            setSelectedItem(null);
          }}
          isExecuteLoading={executingItemAddress === selectedItem.actionBuilderAddress && isExecuting}
          isRemoveLoading={removingItemAddress === selectedItem.actionBuilderAddress && isRemoving}
          connectedAddress={connectedAddress}
          isSigner={isSigner}
          emergencyMode={emergencyMode ?? false}
          emergencyCaller={emergencyCaller}
        />
      )}
    </Container>
  );
};

// Styled Components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  padding: "32px 120px",
  minHeight: "100%",
});

const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  width: "1024px",
  maxWidth: "100%",
});

const LoadingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "400px",
});

const TitleSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  width: "100%",
});

const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "32px 8px 12px 8px",
});

const Title = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "24px",
  fontWeight: 500,
  fontStyle: "italic",
  lineHeight: "32px",
  color: canonHeaderTokens.foreground.accent0,
});

const HelpIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  "&:hover": {
    opacity: 0.8,
  },
});

const SearchFilterBar = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "48px",
  borderRadius: "8px",
  overflow: "hidden",
  width: "100%",
});

const SearchSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
  height: "100%",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const SearchInput = styled("input")({
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
});

const FilterDivider = styled(Box)({
  width: "1px",
  minWidth: "1px",
  height: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const FilterTab = styled("button")<{ $isActive: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "100%",
  padding: "0 20px",
  backgroundColor: canonHeaderTokens.background.layer1,
  border: "none",
  cursor: "pointer",
  opacity: $isActive ? 1 : 0.8,
  "&:hover": {
    opacity: 1,
  },
}));

const FilterLabel = styled("span")<{ $isActive: boolean }>(({ $isActive }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isActive ? canonHeaderTokens.foreground.accent0 : canonHeaderTokens.foreground.accent20,
}));

const FilterCount = styled("span")<{ $isActive: boolean }>(({ $isActive }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: $isActive ? canonHeaderTokens.brand.green : canonHeaderTokens.foreground.accent30,
}));

const QueueItemsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
});

const SectionGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const SectionHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  padding: "8px",
});

const SectionTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
});

const ItemsList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const EmptyState = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "200px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  color: canonHeaderTokens.foreground.accent20,
  fontStyle: "italic",
});

const PaginationRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderRadius: "12px",
  width: "100%",
});

const PaginationInfo = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent30,
  padding: "0 16px",
});

const PaginationControls = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 16px",
});

const PaginationButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.3 : 1,
  padding: 0,
}));

const PageNumber = styled("button")<{ $isActive: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  backgroundColor: $isActive ? canonHeaderTokens.background.layer1 : "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
}));
