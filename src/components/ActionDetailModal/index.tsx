import { useState, useEffect, useRef, useCallback } from "react";
import { Box, styled } from "@mui/material";
import { ExternalLink as ShareIcon } from "lucide-react";
import { XIcon } from "~/components/icons";
import { CopyableText } from "~/components/shared/CopyButton";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { getChainConfig, SupportedChainId } from "~/config/chains";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { QueueItem } from "~/services";
import { RegisteredEntity } from "~/services";
import { DetailsTab } from "./DetailsTab";
import { OverviewTab } from "./OverviewTab";
import type { Address } from "viem";

// Discriminated union for the two modal modes
export type ActionDetailModalData =
  | { mode: "queue"; item: QueueItem }
  | { mode: "canonList"; entity: RegisteredEntity };

type TabId = "overview" | "details";

interface ActionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ActionDetailModalData;
  chainId: SupportedChainId | null;
  // Queue-mode action handlers
  onSign?: () => void;
  onExecute?: () => void;
  onRemove?: () => void;
  isExecuteLoading?: boolean;
  isRemoveLoading?: boolean;
  // Canon list mode handler
  onQueue?: () => void;
  // Signer info
  connectedAddress?: Address;
  isSigner?: boolean;
}

export const ActionDetailModal = ({
  isOpen,
  onClose,
  data,
  chainId,
  onSign,
  onExecute,
  onRemove,
  isExecuteLoading,
  isRemoveLoading,
  onQueue,
  connectedAddress,
  isSigner,
}: ActionDetailModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Derive common fields from both modes
  const label = data.mode === "queue" ? data.item.label : data.entity.label;
  const address = data.mode === "queue" ? data.item.actionBuilderAddress : data.entity.address;
  const isUntitled = !label || label.trim() === "";
  const displayLabel = isUntitled ? "Untitled Transaction" : label;

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleShare = useCallback(() => {
    if (!chainId) return;
    const config = getChainConfig(chainId);
    const url = `${config.blockExplorerUrl}/address/${address}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [chainId, address]);

  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer ref={modalRef}>
        {/* Header */}
        <ModalHeader>
          <HeaderContent>
            <HeaderInfo>
              <ModalTitle $isUntitled={isUntitled}>{displayLabel}</ModalTitle>
              <AddressRow>
                <CopyableText text={address} iconSize={10} iconColor={canonHeaderTokens.foreground.accent20}>
                  <AddressText>{address}</AddressText>
                </CopyableText>
              </AddressRow>
            </HeaderInfo>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <XIcon size={18} color={canonHeaderTokens.foreground.accent20} />
          </CloseButton>
        </ModalHeader>

        {/* Tab Bar */}
        <TabBar>
          <TabBarInner>
            <Tab $isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              <TabLabel $isActive={activeTab === "overview"}>OVERVIEW</TabLabel>
            </Tab>
            <TabDivider />
            <Tab $isActive={activeTab === "details"} onClick={() => setActiveTab("details")}>
              <TabLabel $isActive={activeTab === "details"}>DETAILS</TabLabel>
            </Tab>
            <TabDivider />
            <StyledTooltip title='Transaction simulation coming soon' placement='top'>
              <TabDisabled>
                <TabLabel $isActive={false}>SIMULATE</TabLabel>
              </TabDisabled>
            </StyledTooltip>
            <TabDivider />
            <TabSpacer />
            <ShareButton onClick={handleShare}>
              <TabLabel $isActive={false}>SHARE</TabLabel>
              <ShareIcon size={14} color={canonHeaderTokens.foreground.accent20} />
            </ShareButton>
          </TabBarInner>
        </TabBar>

        {/* Tab Content */}
        <TabContent>
          {activeTab === "overview" && (
            <OverviewTab
              data={data}
              onSign={onSign}
              onExecute={onExecute}
              onRemove={onRemove}
              onQueue={onQueue}
              isExecuteLoading={isExecuteLoading}
              isRemoveLoading={isRemoveLoading}
              connectedAddress={connectedAddress}
              isSigner={isSigner}
            />
          )}
          {activeTab === "details" && <DetailsTab data={data} chainId={chainId} />}
        </TabContent>
      </ModalContainer>
    </Overlay>
  );
};

// Styled components
const Overlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
});

const ModalContainer = styled(Box)({
  width: "512px",
  maxHeight: "800px",
  backgroundColor: canonHeaderTokens.background.layer0,
  borderRadius: "16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.3), 0px 8px 10px -6px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

const ModalHeader = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "24px 24px 16px 24px",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const HeaderContent = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  flex: 1,
  minWidth: 0,
});

const HeaderInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
});

const ModalTitle = styled("span", {
  shouldForwardProp: (prop) => prop !== "$isUntitled",
})<{ $isUntitled: boolean }>(({ $isUntitled }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: $isUntitled ? canonHeaderTokens.foreground.accent20 : canonHeaderTokens.foreground.accent0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

const AddressRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const AddressText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const CloseButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  padding: "4px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  borderRadius: "4px",
  flexShrink: 0,
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const TabBar = styled(Box)({
  padding: "0 12px",
});

const TabBarInner = styled(Box)({
  display: "flex",
  alignItems: "stretch",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)",
});

const Tab = styled("button", {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 20px",
  backgroundColor: $isActive ? canonHeaderTokens.background.layer1Variation : canonHeaderTokens.background.layer1,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
  "&:hover": {
    opacity: $isActive ? 1 : 0.8,
  },
}));

const TabDisabled = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 20px",
  backgroundColor: canonHeaderTokens.background.layer1,
  cursor: "not-allowed",
  opacity: 0.5,
  flexShrink: 0,
});

const TabLabel = styled("span", {
  shouldForwardProp: (prop) => prop !== "$isActive",
})<{ $isActive: boolean }>(({ $isActive }) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: $isActive ? canonHeaderTokens.foreground.accent0 : canonHeaderTokens.foreground.accent20,
}));

const TabDivider = styled(Box)({
  width: "0.5px",
  alignSelf: "stretch",
  backgroundColor: canonHeaderTokens.foreground.accent50,
  flexShrink: 0,
});

const TabSpacer = styled(Box)({
  flex: 1,
  backgroundColor: canonHeaderTokens.background.layer1,
});

const ShareButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  padding: "16px 20px",
  backgroundColor: canonHeaderTokens.background.layer1,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
  "&:hover": {
    opacity: 0.8,
  },
});

const TabContent = styled(Box)({
  flex: 1,
  overflow: "auto",
  padding: "6px 12px 12px 12px",
});
