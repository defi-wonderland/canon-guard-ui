import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, styled, CircularProgress } from "@mui/material";
import { ActionDetailModal } from "~/components/ActionDetailModal";
import {
  SearchIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
} from "~/components/icons";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams, useWallet, useIsSigner } from "~/hooks";
import { useClientService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { useTransactionExecutor } from "~/hooks/useTransactionExecutor";
import { RegistryService, RegisteredEntity } from "~/services";
import { getFactoryDisplayName } from "~/utils/factoryDisplay";
import { ActionItem } from "./ActionItem";
import { PreApproveDurationModal } from "./PreApproveDurationModal";
import { RenameModal } from "./RenameModal";
import type { Address } from "viem";

// Extended entity type for grouped display
interface DisplayEntity extends RegisteredEntity {
  children?: RegisteredEntity[];
}

export const CanonListSection = () => {
  const { guardAddress, chainId } = useStateContext();
  const clientService = useClientService();
  const navigateWithParams = useNavigateWithParams();
  const { executeRemoveFromRegistry, executeRecordToRegistry, isExecuting } = useTransactionExecutor();
  const { isConnected } = useWallet();
  const isSigner = useIsSigner();

  const [entities, setEntities] = useState<RegisteredEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [removingAddress, setRemovingAddress] = useState<Address | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Hub expansion state - tracks which hubs are expanded
  const [expandedHubs, setExpandedHubs] = useState<Set<Address>>(new Set());

  // Pre-approve modal state
  const [preApproveModalOpen, setPreApproveModalOpen] = useState(false);
  const [selectedEntityForPreApprove, setSelectedEntityForPreApprove] = useState<RegisteredEntity | null>(null);

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedEntityForRename, setSelectedEntityForRename] = useState<RegisteredEntity | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Action detail modal state
  const [selectedEntityForDetail, setSelectedEntityForDetail] = useState<RegisteredEntity | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchEntities = useCallback(async () => {
    if (!guardAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const registryService = new RegistryService(clientService);
      const offset = (currentPage - 1) * itemsPerPage;

      const [fetchedEntities, total] = await Promise.all([
        registryService.getRegisteredEntities(
          guardAddress,
          guardAddress, // entrypoint address (same as guardAddress)
          offset,
          itemsPerPage,
        ),
        registryService.getTotalEntities(guardAddress),
      ]);

      setEntities(fetchedEntities);
      setTotalCount(total);
    } catch (err) {
      console.error("Failed to fetch registry entities:", err);
      setError("Failed to load Canon List");
    } finally {
      setLoading(false);
    }
  }, [guardAddress, clientService, currentPage]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Group entities: hubs with their children, standalone entities remain separate
  // Children are entities whose parentHubAddress matches a hub's address
  const groupedEntities = useMemo((): DisplayEntity[] => {
    // First, separate hubs and children
    const hubs = entities.filter((e) => e.isHub);
    const children = entities.filter((e) => e.parentHubAddress && !e.isHub);
    const standalone = entities.filter((e) => !e.isHub && !e.parentHubAddress);

    // Create a map of hub address to children
    const hubChildrenMap = new Map<Address, RegisteredEntity[]>();
    for (const child of children) {
      if (child.parentHubAddress) {
        const existing = hubChildrenMap.get(child.parentHubAddress) || [];
        hubChildrenMap.set(child.parentHubAddress, [...existing, child]);
      }
    }

    // Build display entities: hubs with their children, then standalone
    const result: DisplayEntity[] = [];

    for (const hub of hubs) {
      const hubChildren = hubChildrenMap.get(hub.address) || [];
      result.push({
        ...hub,
        children: hubChildren,
        childrenCount: hubChildren.length,
      });
    }

    // Add standalone entities (not hubs, not children of hubs)
    for (const entity of standalone) {
      result.push(entity);
    }

    return result;
  }, [entities]);

  // Filter entities based on search query
  const filteredEntities = useMemo((): DisplayEntity[] => {
    if (!searchQuery) return groupedEntities;
    const query = searchQuery.toLowerCase();

    return groupedEntities.filter((entity) => {
      const matchesLabel = entity.label?.toLowerCase().includes(query);
      const matchesAddress = entity.address.toLowerCase().includes(query);

      // For hubs, also check if any children match
      if (entity.isHub && entity.children) {
        const childMatches = entity.children.some(
          (child) => child.label?.toLowerCase().includes(query) || child.address.toLowerCase().includes(query),
        );
        return matchesLabel || matchesAddress || childMatches;
      }

      return matchesLabel || matchesAddress;
    });
  }, [groupedEntities, searchQuery]);

  // Toggle hub expansion
  const handleToggleHubExpansion = useCallback((hubAddress: Address) => {
    setExpandedHubs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hubAddress)) {
        newSet.delete(hubAddress);
      } else {
        newSet.add(hubAddress);
      }
      return newSet;
    });
  }, []);

  const handleQueue = useCallback(
    (entity: RegisteredEntity) => {
      // Navigate to queue action page
      // Note: This flow is not refresh-safe since details are in state only
      navigateWithParams("/queue-action", {
        state: {
          actionBuilderAddress: entity.address,
          label: entity.label,
          factoryType: getFactoryDisplayName(entity.factoryType),
        },
      });
    },
    [navigateWithParams],
  );

  const handleAddToQueue = useCallback(
    (entity: RegisteredEntity) => {
      // Same as handleQueue
      navigateWithParams("/queue-action", {
        state: {
          actionBuilderAddress: entity.address,
          label: entity.label,
          factoryType: getFactoryDisplayName(entity.factoryType),
        },
      });
    },
    [navigateWithParams],
  );

  const handleRename = useCallback((entity: RegisteredEntity) => {
    setSelectedEntityForRename(entity);
    setRenameModalOpen(true);
  }, []);

  const handleRenameSubmit = useCallback(
    async (newLabel: string) => {
      if (!selectedEntityForRename || !guardAddress) return;

      setIsRenaming(true);
      try {
        const result = await executeRecordToRegistry(
          guardAddress as Address,
          selectedEntityForRename.address,
          newLabel,
        );

        if (result) {
          console.log("Entity renamed successfully:", result);
          // Optimistic update: update local state without refetching
          setEntities((prev) =>
            prev.map((e) => (e.address === selectedEntityForRename.address ? { ...e, label: newLabel } : e)),
          );
          // Close modal
          setRenameModalOpen(false);
          setSelectedEntityForRename(null);
        }
      } catch (err) {
        console.error("Failed to rename entity:", err);
      } finally {
        setIsRenaming(false);
      }
    },
    [selectedEntityForRename, guardAddress, executeRecordToRegistry],
  );

  const handleRenameClose = useCallback(() => {
    if (!isRenaming) {
      setRenameModalOpen(false);
      setSelectedEntityForRename(null);
    }
  }, [isRenaming]);

  const handleProposePreApproval = useCallback(
    (entity: RegisteredEntity) => {
      // If already pre-approved, skip modal and navigate directly with duration=0
      if (entity.isFastPath) {
        navigateWithParams("/queue-action", {
          state: {
            actionBuilderAddress: entity.address,
            label: entity.label,
            factoryType: getFactoryDisplayName(entity.factoryType),
            approvalDuration: 0n,
          },
        });
        return;
      }
      // Otherwise, open the modal to select duration
      setSelectedEntityForPreApprove(entity);
      setPreApproveModalOpen(true);
    },
    [navigateWithParams],
  );

  const handlePreApproveSubmit = useCallback(
    (durationSeconds: bigint) => {
      if (!selectedEntityForPreApprove) return;

      // Close modal
      setPreApproveModalOpen(false);

      // Navigate to queue action page - pre-approve mode is determined by presence of approvalDuration
      // Note: This flow is not refresh-safe since duration is in state only
      navigateWithParams("/queue-action", {
        state: {
          actionBuilderAddress: selectedEntityForPreApprove.address,
          label: selectedEntityForPreApprove.label,
          factoryType: getFactoryDisplayName(selectedEntityForPreApprove.factoryType),
          approvalDuration: durationSeconds,
        },
      });

      // Clear selected entity
      setSelectedEntityForPreApprove(null);
    },
    [selectedEntityForPreApprove, navigateWithParams],
  );

  const handlePreApproveClose = useCallback(() => {
    setPreApproveModalOpen(false);
    setSelectedEntityForPreApprove(null);
  }, []);

  const handleRemove = useCallback(
    async (entity: RegisteredEntity) => {
      if (!guardAddress || isExecuting) return;

      setRemovingAddress(entity.address);
      try {
        const result = await executeRemoveFromRegistry(guardAddress as Address, [entity.address]);

        if (result) {
          console.log("Entity removed successfully:", result);
          // Optimistically remove from local state
          setEntities((prev) => prev.filter((e) => e.address !== entity.address));
        }
      } catch (err) {
        console.error("Failed to remove entity:", err);
      }
      setRemovingAddress(null);
    },
    [guardAddress, isExecuting, executeRemoveFromRegistry],
  );

  // Handle deploying a child from a hub
  const handleDeployChild = useCallback(
    (hubEntity: RegisteredEntity) => {
      navigateWithParams(`/create/hub-child/${hubEntity.address}`, {
        state: {
          hubLabel: hubEntity.label,
          isFastPath: hubEntity.isFastPath,
        },
      });
    },
    [navigateWithParams],
  );

  return (
    <Container>
      <ContentWrapper>
        {/* Header Section */}
        <HeaderSection>
          <TitleRow>
            <TitleGroup>
              <PageTitle data-testid='canon-list-title'>Canon list</PageTitle>
              <StyledTooltip
                title='Your saved transactions and action hubs. Queue, rename, or propose pre-approvals for fast execution.'
                placement='right'
              >
                <HelpIconWrapper>
                  <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
                </HelpIconWrapper>
              </StyledTooltip>
            </TitleGroup>
          </TitleRow>

          {/* Info Banner */}
          <InfoBanner>
            <InfoContent>
              <IconWrapper>
                <ShieldCheckIcon size={20} color={canonHeaderTokens.brand.green} />
              </IconWrapper>
              <InfoText>
                New transactions are saved to your Canon List, making it easy to manage and reuse them over time.
              </InfoText>
            </InfoContent>
          </InfoBanner>

          {/* Search Bar */}
          <SearchBar>
            <SearchSection>
              <SearchIcon size={16} color={canonHeaderTokens.foreground.accent0} />
              <SearchInput
                type='text'
                placeholder='Search by name or 0x...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchSection>
          </SearchBar>
        </HeaderSection>

        {/* Content Section */}
        <ListSection>
          {filteredEntities.length > 0 && (
            <SectionHeader>
              <SectionLabel>SAVED TRANSACTIONS</SectionLabel>
            </SectionHeader>
          )}

          {loading ? (
            <LoadingState>
              <CircularProgress size={24} sx={{ color: canonHeaderTokens.brand.green }} />
              <LoadingText>Loading actions...</LoadingText>
            </LoadingState>
          ) : error ? (
            <ErrorState>
              <ErrorText>{error}</ErrorText>
            </ErrorState>
          ) : entities.length === 0 ? (
            <EmptyState>
              <EmptyText>No saved transactions yet</EmptyText>
              <EmptySubtext>Create your first action and it will appear here in your Canon List.</EmptySubtext>
            </EmptyState>
          ) : filteredEntities.length === 0 ? (
            <SearchEmptyState>No items match your search</SearchEmptyState>
          ) : (
            <ItemsList>
              {filteredEntities.map((entity) => (
                <Box key={entity.address}>
                  <ActionItem
                    title={entity.label}
                    address={entity.address}
                    factoryType={entity.factoryType}
                    isFastPath={entity.isFastPath}
                    isHub={entity.isHub}
                    childrenCount={entity.childrenCount}
                    isExpanded={expandedHubs.has(entity.address)}
                    onToggleExpand={entity.isHub ? () => handleToggleHubExpansion(entity.address) : undefined}
                    onQueue={entity.isHub ? undefined : () => handleQueue(entity)}
                    onAddToQueue={entity.isHub ? undefined : () => handleAddToQueue(entity)}
                    onRename={() => handleRename(entity)}
                    onProposePreApproval={() => handleProposePreApproval(entity)}
                    onDeployChild={entity.isHub ? () => handleDeployChild(entity) : undefined}
                    onRemove={() => handleRemove(entity)}
                    onTitleClick={() => setSelectedEntityForDetail(entity)}
                    isRemoving={removingAddress === entity.address && isExecuting}
                    isConnected={isConnected}
                    isSigner={isSigner}
                  />
                  {/* Render children if hub is expanded and has children */}
                  {entity.isHub &&
                    entity.children &&
                    entity.children.length > 0 &&
                    expandedHubs.has(entity.address) && (
                      <ChildrenContainer>
                        {entity.children.map((child, index) => (
                          <ChildWrapper key={child.address} style={{ zIndex: entity.children!.length - index }}>
                            {/* Tree connector visual */}
                            <TreeConnector $isLast={index === entity.children!.length - 1}>
                              <TreeVerticalLine $isLast={index === entity.children!.length - 1} />
                              <TreeHorizontalBranch />
                              <TreeDot />
                            </TreeConnector>
                            <ChildItemWrapper>
                              <ActionItem
                                title={child.label}
                                address={child.address}
                                factoryType={child.factoryType}
                                isFastPath={false} // Children don't show fast/slow path
                                isHubChild={true}
                                onQueue={undefined} // Children use Add to Queue menu instead
                                onAddToQueue={() => handleAddToQueue(child)}
                                onRename={() => handleRename(child)}
                                onProposePreApproval={undefined} // Children don't have pre-approval
                                onRemove={undefined} // Children can't be removed directly
                                onTitleClick={() => setSelectedEntityForDetail(child)}
                                isRemoving={false}
                                isConnected={isConnected}
                                isSigner={isSigner}
                              />
                            </ChildItemWrapper>
                          </ChildWrapper>
                        ))}
                      </ChildrenContainer>
                    )}
                </Box>
              ))}
            </ItemsList>
          )}

          {/* Pagination */}
          {filteredEntities.length > 0 && (
            <PaginationRow>
              <PaginationInfo>
                Showing {Math.min(itemsPerPage, entities.length)} out of {totalCount}
              </PaginationInfo>
              <PaginationControls>
                <PaginationArrow onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeftIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                </PaginationArrow>

                {/* Page numbers */}
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PageNumber key={pageNum} $active={currentPage === pageNum} onClick={() => setCurrentPage(pageNum)}>
                      {pageNum}
                    </PageNumber>
                  );
                })}

                {totalPages > 3 && (
                  <>
                    <EllipsisIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                    <PageNumber $active={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </PageNumber>
                  </>
                )}

                <PaginationArrow
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon size={14} color={canonHeaderTokens.foreground.accent10} />
                </PaginationArrow>
              </PaginationControls>
            </PaginationRow>
          )}
        </ListSection>
      </ContentWrapper>

      {/* Pre-Approve Duration Modal */}
      <PreApproveDurationModal
        isOpen={preApproveModalOpen}
        onClose={handlePreApproveClose}
        onSubmit={handlePreApproveSubmit}
        actionLabel={selectedEntityForPreApprove?.label}
        guardAddress={guardAddress as Address | null}
        chainId={chainId}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={renameModalOpen}
        onClose={handleRenameClose}
        onSubmit={handleRenameSubmit}
        currentLabel={selectedEntityForRename?.label || ""}
        isLoading={isRenaming}
      />

      {/* Action Detail Modal */}
      {selectedEntityForDetail && (
        <ActionDetailModal
          isOpen={!!selectedEntityForDetail}
          onClose={() => setSelectedEntityForDetail(null)}
          data={{ mode: "canonList", entity: selectedEntityForDetail }}
          chainId={chainId}
        />
      )}
    </Container>
  );
};

// Styled components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flex: 1,
  padding: "32px 120px",
  width: "100%",
  minHeight: "100%",
});

const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  width: "1024px",
  maxWidth: "100%",
});

const HeaderSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  padding: "32px 8px 12px 8px",
});

const TitleGroup = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
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

const PageTitle = styled(Typography)({
  fontSize: "24px",
  fontWeight: 600,
  fontStyle: "italic",
  lineHeight: "32px",
  color: canonHeaderTokens.foreground.accent0,
});

const InfoBanner = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  padding: "20px",
  overflow: "hidden",
});

const InfoContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

const IconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "100px",
});

const InfoText = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
});

const SearchBar = styled(Box)({
  display: "flex",
  alignItems: "center",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  height: "48px",
});

const SearchSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
  padding: "16px",
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

const ListSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const SectionHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  padding: "8px",
});

const SectionLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
});

const ItemsList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const ChildrenContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginTop: "6px",
  paddingBottom: "12px",
});

// Wrapper for each child item with tree connector
const ChildWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  width: "100%",
  position: "relative", // Required for z-index stacking of dropdown menus
});

// Tree connector container (left side visual)
const TreeConnector = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isLast",
})<{ $isLast: boolean }>({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  width: "24px",
  height: "100%",
  alignSelf: "stretch",
  backgroundColor: canonHeaderTokens.foreground.accent50,
});

// Vertical line that runs down the left side
const TreeVerticalLine = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isLast",
})<{ $isLast: boolean }>(({ $isLast }) => ({
  position: "absolute",
  left: "9px",
  top: "42px",
  width: "11px",
  height: "50px",
  borderLeft: `0.5px solid ${canonHeaderTokens.foreground.accent40}`,
  opacity: $isLast ? 0 : 1,
}));

// Horizontal branch connecting to the child
const TreeHorizontalBranch = styled(Box)({
  width: "15px",
  height: "42px",
  borderLeft: `0.5px solid ${canonHeaderTokens.foreground.accent40}`,
  borderBottom: `0.5px solid ${canonHeaderTokens.foreground.accent40}`,
});

// Small dot at the connection point
const TreeDot = styled(Box)({
  position: "absolute",
  left: "7px",
  top: "40px",
  width: "4px",
  height: "4px",
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `0.5px solid ${canonHeaderTokens.foreground.accent30}`,
});

// Wrapper for the actual child ActionItem
const ChildItemWrapper = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const LoadingState = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  padding: "48px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
});

const LoadingText = styled(Typography)({
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent20,
});

const ErrorState = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
});

const ErrorText = styled(Typography)({
  fontSize: "14px",
  color: canonHeaderTokens.status.red,
});

const EmptyState = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "64px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
});

const EmptyText = styled(Typography)({
  fontSize: "16px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent10,
});

const EmptySubtext = styled(Typography)({
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent20,
  textAlign: "center",
});

const SearchEmptyState = styled(Box)({
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
});

const PaginationInfo = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  padding: "0 16px",
});

const PaginationControls = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 16px",
});

const PaginationArrow = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "14px",
  height: "14px",
  background: "none",
  border: "none",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.4 : 1,
  padding: 0,
}));

const PageNumber = styled("button")<{ $active?: boolean }>(({ $active }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  backgroundColor: $active ? canonHeaderTokens.background.layer1 : "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1,
  },
}));
