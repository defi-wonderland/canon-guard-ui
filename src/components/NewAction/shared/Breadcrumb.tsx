import { Box, Typography, styled } from "@mui/material";
import { ChevronRightIcon, HelpCircleIcon } from "~/components/icons";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface BreadcrumbProps {
  onNavigateToCreate: () => void;
  currentPage: string;
  /** If true, shows only the current page without "Create >" prefix */
  standalone?: boolean;
  /** Custom text for the first link (defaults to "Create") */
  firstLinkText?: string;
  /** Tooltip text for the help icon */
  tooltipText?: string;
}

export const Breadcrumb = ({
  onNavigateToCreate,
  currentPage,
  standalone = false,
  firstLinkText = "Create",
  tooltipText = "Configure your transaction details. Once complete, you can deploy, propose, or pre-approve it.",
}: BreadcrumbProps) => {
  return (
    <BreadcrumbContainer>
      {!standalone && (
        <>
          <BreadcrumbLink onClick={onNavigateToCreate}>{firstLinkText}</BreadcrumbLink>
          <ChevronRightIcon size={14} color={canonHeaderTokens.foreground.accent20} />
        </>
      )}
      <CurrentPage>{currentPage}</CurrentPage>
      <StyledTooltip title={tooltipText} placement='right'>
        <HelpIconWrapper>
          <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
        </HelpIconWrapper>
      </StyledTooltip>
    </BreadcrumbContainer>
  );
};

const BreadcrumbContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "32px 8px 12px 8px",
  width: "100%",
});

const BreadcrumbLink = styled(Typography)({
  fontSize: "24px",
  fontWeight: 600,
  fontStyle: "italic",
  lineHeight: "32px",
  color: canonHeaderTokens.foreground.accent20,
  cursor: "pointer",
  transition: "color 0.2s ease",
  "&:hover": {
    color: canonHeaderTokens.foreground.accent10,
  },
});

const CurrentPage = styled(Typography)({
  fontSize: "24px",
  fontWeight: 600,
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
