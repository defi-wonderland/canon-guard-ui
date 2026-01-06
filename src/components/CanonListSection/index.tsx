import { useState, useEffect, useCallback } from "react";
import { Box, Typography, styled, CircularProgress } from "@mui/material";
import {
  SearchIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
} from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams } from "~/hooks";
import { useClientService } from "~/hooks/useServices";
import { useStateContext } from "~/hooks/useStateContext";
import { useTransactionExecutor } from "~/hooks/useTransactionExecutor";
import { RegistryService, RegisteredEntity } from "~/services";
import { SafeInfo } from "~/types";
import { getFactoryDisplayName } from "~/utils/factoryDisplay";
import { ActionItem } from "./ActionItem";
import { PreApproveDurationModal } from "./PreApproveDurationModal";
import { RenameModal } from "./RenameModal";
import type { Address } from "viem";

interface CanonListSectionProps {
  safeInfo: SafeInfo;
}

export const CanonListSection = ({ safeInfo }: CanonListSectionProps) => {
  const { guardAddress, chainId } = useStateContext();
  const clientService = useClientService();
  const navigateWithParams = useNavigateWithParams();
  const { executeRemoveFromRegistry, executeRecordToRegistry, isExecuting } = useTransactionExecutor();

  const [entities, setEntities] = useState<RegisteredEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [removingAddress, setRemovingAddress] = useState<Address | null>(null);

  // Pre-approve modal state
  const [preApproveModalOpen, setPreApproveModalOpen] = useState(false);
  const [selectedEntityForPreApprove, setSelectedEntityForPreApprove] = useState<RegisteredEntity | null>(null);

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedEntityForRename, setSelectedEntityForRename] = useState<RegisteredEntity | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchEntities = useCallback(async () => {
    if (!guardAddress || !safeInfo.guardAddress) {
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
          safeInfo.guardAddress, // entrypoint address
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
  }, [guardAddress, safeInfo.guardAddress, clientService, currentPage]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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

  const handleProposePreApproval = useCallback((entity: RegisteredEntity) => {
    setSelectedEntityForPreApprove(entity);
    setPreApproveModalOpen(true);
  }, []);

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

  return (
    <Container>
      <ContentWrapper>
        {/* Header Section */}
        <HeaderSection>
          <TitleRow>
            <TitleGroup>
              <PageTitle>Canon list</PageTitle>
              <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
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
            <ImportButton>
              <ImportButtonText>IMPORT ACTION</ImportButtonText>
            </ImportButton>
          </InfoBanner>

          {/* Search Bar */}
          <SearchBar>
            <SearchSection>
              <SearchIcon size={16} color={canonHeaderTokens.foreground.accent0} />
              <SearchPlaceholder>Search by name or 0x...</SearchPlaceholder>
            </SearchSection>
          </SearchBar>
        </HeaderSection>

        {/* Content Section */}
        <ListSection>
          <SectionHeader>
            <SectionLabel>SAVED TRANSACTIONS</SectionLabel>
          </SectionHeader>

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
          ) : (
            <ItemsList>
              {entities.map((entity) => (
                <ActionItem
                  key={entity.address}
                  title={entity.label}
                  address={entity.address}
                  factoryType={entity.factoryType}
                  isFastPath={entity.isFastPath}
                  onQueue={() => handleQueue(entity)}
                  onAddToQueue={() => handleAddToQueue(entity)}
                  onRename={() => handleRename(entity)}
                  onProposePreApproval={() => handleProposePreApproval(entity)}
                  onRemove={() => handleRemove(entity)}
                  isRemoving={removingAddress === entity.address && isExecuting}
                />
              ))}
            </ItemsList>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
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
  maxWidth: "350px",
});

const ImportButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "36px",
  padding: "8px 20px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "100px",
  backgroundColor: "transparent",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const ImportButtonText = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
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

const SearchPlaceholder = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent30,
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

export default CanonListSection;
