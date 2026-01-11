import { Box, Typography, styled } from "@mui/material";
import { BoxIcon, ChevronRightIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ActionFactoryType } from "~/types/canon-guard";
import { FACTORY_DISPLAY_NAMES } from "~/utils/factoryDisplay";
import { Breadcrumb, FormSection } from "../shared";
import type { FactoryType } from "./index";

interface FactoryOption {
  id: FactoryType;
  label: string;
}

const FACTORY_OPTIONS: FactoryOption[] = [
  { id: "arbitrary-action", label: FACTORY_DISPLAY_NAMES[ActionFactoryType.ARBITRARY_ACTIONS]! },
  { id: "transfer", label: FACTORY_DISPLAY_NAMES[ActionFactoryType.SIMPLE_TRANSFERS]! },
  { id: "claim-allowance", label: FACTORY_DISPLAY_NAMES[ActionFactoryType.ALLOWANCE_CLAIMOR]! },
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

        <FormSection label='SELECT CANON FACTORY'>
          <FactoryList>
            {FACTORY_OPTIONS.map((option) => (
              <FactoryItem key={option.id} onClick={() => onSelectFactory(option.id)}>
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

const FactoryList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
});

const FactoryItem = styled(Box)({
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

const FactoryLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
  textTransform: "uppercase",
});
