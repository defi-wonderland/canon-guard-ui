import { Box, Typography, styled } from "@mui/material";
import { BoxIcon, ChevronRightIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import {
  Breadcrumb,
  FormSection,
  StepContentWrapper as ContentWrapper,
  StepPageContainer as Container,
} from "../shared";
import type { FactoryType } from "./index";

interface FactoryOption {
  id: FactoryType;
  label: string;
  testId: string;
}

const FACTORY_OPTIONS: FactoryOption[] = [
  {
    id: "arbitrary-action",
    label: FACTORY_DISPLAY_NAMES[ActionFactoryType.ARBITRARY_ACTIONS]!,
    testId: "arbitrary-action-option",
  },
  { id: "transfer", label: FACTORY_DISPLAY_NAMES[ActionFactoryType.SIMPLE_TRANSFERS]!, testId: "transfer-option" },
  {
    id: "claim-allowance",
    label: FACTORY_DISPLAY_NAMES[ActionFactoryType.ALLOWANCE_CLAIMOR]!,
    testId: "claim-allowance-option",
  },
];

interface SelectFactoryStepProps {
  onSelectFactory: (factory: FactoryType) => void;
  onNavigateToCreate: () => void;
}

export const SelectFactoryStep = ({ onSelectFactory, onNavigateToCreate }: SelectFactoryStepProps) => {
  return (
    <Container>
      <ContentWrapper>
        <Breadcrumb onNavigateToCreate={onNavigateToCreate} currentPage='New Action' />

        <FormSection label='SELECT CANON FACTORY' data-testid='select-factory-title'>
          <FactoryList>
            {FACTORY_OPTIONS.map((option) => (
              <FactoryItem key={option.id} onClick={() => onSelectFactory(option.id)} data-testid={option.testId}>
                <LeftContent>
                  <BoxIcon size={16} color={canonHeaderTokens.foreground.accent20} />
                  <FactoryLabel>{option.label}</FactoryLabel>
                </LeftContent>
                <ChevronRightIcon size={16} color={canonHeaderTokens.foreground.accent10} />
              </FactoryItem>
            ))}
          </FactoryList>
        </FormSection>
      </ContentWrapper>
    </Container>
  );
};

const FactoryList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const FactoryItem = styled(Box)(({ theme }) => ({
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
  [theme.breakpoints.down("sm")]: {
    padding: "14px 12px",
  },
}));

const LeftContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
});

const FactoryLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
  overflowWrap: "anywhere",
});
