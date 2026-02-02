import { Box, Typography, styled } from "@mui/material";
import { Layers2Icon, ChevronRightIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { HUB_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { Breadcrumb, FormSection } from "../shared";
import type { HubType } from "./index";

interface HubOption {
  id: HubType;
  label: string;
  testId: string;
}

const HUB_OPTIONS: HubOption[] = [
  {
    id: "capped-transfer-hub",
    label: `HUB: ${HUB_DISPLAY_NAMES[ActionFactoryType.CAPPED_TOKEN_TRANSFERS]}`,
    testId: "capped-transfer-hub-option",
  },
];

interface SelectHubTypeStepProps {
  onSelectHub: (hub: HubType) => void;
  onNavigateToCreate: () => void;
}

export const SelectHubTypeStep = ({ onSelectHub, onNavigateToCreate }: SelectHubTypeStepProps) => {
  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action from Hub' />

        <FormSection label='SELECT HUB TYPE' data-testid='select-hub-type-title'>
          <HubList>
            {HUB_OPTIONS.map((option) => (
              <HubItem key={option.id} onClick={() => onSelectHub(option.id)} data-testid={option.testId}>
                <LeftContent>
                  <Layers2Icon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <HubLabel>{option.label}</HubLabel>
                </LeftContent>
                <ChevronRightIcon size={16} color={canonHeaderTokens.foreground.accent10} />
              </HubItem>
            ))}
          </HubList>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};

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

const HubList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const HubItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "8px",
  cursor: "pointer",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.85,
  },
});

const LeftContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const HubLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
});
