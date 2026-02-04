import { Box, Typography, styled } from "@mui/material";
import { useLocation } from "react-router-dom";
import { BoxIcon, VectorSquareIcon, FileJsonIcon, StarIcon, HelpCircleIcon } from "~/components/icons";
import { StyledTooltip } from "~/components/shared/StyledComponents";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useNavigateWithParams } from "~/hooks";
import { NewActionSection } from "./NewAction";

// Action type definitions
type ActionType = "new-action" | "new-action-hub" | "import-json" | "canon-list";

interface ActionTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  "data-testid"?: string;
}

const ActionTypeCard = ({ icon, title, description, onClick, "data-testid": testId }: ActionTypeCardProps) => {
  return (
    <CardContainer onClick={onClick} data-testid={testId}>
      <IconArea>{icon}</IconArea>
      <ContentArea>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </ContentArea>
    </CardContainer>
  );
};

// Main Create view component
const CreateMain = () => {
  const navigateWithParams = useNavigateWithParams();

  const handleActionClick = (actionType: ActionType) => {
    if (actionType === "new-action") {
      navigateWithParams("/create/action");
    } else if (actionType === "new-action-hub") {
      navigateWithParams("/create/hub");
    } else if (actionType === "canon-list") {
      navigateWithParams("/canon-list");
    }
    // Other action types will be implemented later
  };

  return (
    <Container>
      <ContentWrapper>
        {/* Page Title */}
        <TitleSection>
          <PageTitle data-testid='create-page-title'>Create transaction</PageTitle>
          <StyledTooltip
            title='Build new transactions, create action hubs, or reuse saved transactions from your Canon List.'
            placement='right'
          >
            <HelpIconWrapper>
              <HelpCircleIcon size={18} color={canonHeaderTokens.foreground.accent20} />
            </HelpIconWrapper>
          </StyledTooltip>
        </TitleSection>

        {/* Build New Transaction Section */}
        <Section>
          <SectionLabel>BUILD NEW TRANSACTION</SectionLabel>
          <CardsContainer>
            <ActionTypeCard
              icon={<BoxIcon size={24} color={canonHeaderTokens.foreground.accent20} />}
              title='New Action'
              description='Build a single onchain transaction with your chosen target, data, and value...'
              onClick={() => handleActionClick("new-action")}
              data-testid='new-action-button'
            />
            <ActionTypeCard
              icon={<VectorSquareIcon size={24} color={canonHeaderTokens.foreground.accent20} />}
              title='New Action from Hub'
              description='Set up a policy hub that manages related actions. Hubs help organize and verify ...'
              onClick={() => handleActionClick("new-action-hub")}
              data-testid='new-action-hub-button'
            />
            <ActionTypeCard
              icon={<FileJsonIcon size={24} color={canonHeaderTokens.foreground.accent20} />}
              title='Import JSON File'
              description='Load existing actions or hubs from a JSON file to quickly reuse, review, or edit them.'
              onClick={() => handleActionClick("import-json")}
            />
          </CardsContainer>
        </Section>

        {/* Reuse From Canon List Section */}
        <Section>
          <SectionLabel>REUSE FROM YOUR CANON LIST</SectionLabel>
          <CardsContainer>
            <ActionTypeCard
              icon={<StarIcon size={24} color={canonHeaderTokens.foreground.accent20} />}
              title='Canon List'
              description='Reuse past transactions saved to your Canon List for faster execution.'
              onClick={() => handleActionClick("canon-list")}
            />
          </CardsContainer>
        </Section>
      </ContentWrapper>
    </Container>
  );
};

interface CreateSectionProps {
  onQueueCountChange?: () => void;
}

export const CreateSection = ({ onQueueCountChange }: CreateSectionProps) => {
  const location = useLocation();

  // Determine what to render based on current path
  const path = location.pathname;

  // If at /create exactly, show the main create view
  if (path === "/create") {
    return <CreateMain />;
  }

  // If at /create/action or deeper, show the NewActionSection
  if (path.startsWith("/create/action")) {
    return <NewActionSection onQueueCountChange={onQueueCountChange} />;
  }

  // If at /create/hub or deeper, show the NewActionSection (hub flow)
  if (path.startsWith("/create/hub")) {
    return <NewActionSection onQueueCountChange={onQueueCountChange} />;
  }

  // Default to main create view
  return <CreateMain />;
};

// Styled components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 120px 64px",
  width: "100%",
  boxSizing: "border-box",
});

const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
  maxWidth: "576px",
});

const TitleSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "32px 8px 12px",
});

const PageTitle = styled(Typography)({
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

const Section = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const SectionLabel = styled(Typography)({
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  padding: "8px",
  textTransform: "uppercase",
});

const CardsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

// Card components
const CardContainer = styled(Box)({
  display: "flex",
  alignItems: "stretch",
  borderRadius: "8px",
  overflow: "hidden",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.85,
  },
});

const IconArea = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "132px",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const ContentArea = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  flex: 1,
  padding: "20px 24px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderLeft: `1px dashed ${canonHeaderTokens.background.layer0}`,
});

const CardTitle = styled(Typography)({
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const CardDescription = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
  maxWidth: "264px",
});
