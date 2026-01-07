import { Box, Typography, Button, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { HeaderLogo } from "./Header";
import {
  PageContainer,
  SetupHeader,
  SetupContentArea,
  SetupFormWrapper,
  SetupSectionTitle,
} from "./shared/StyledComponents";

interface ErrorStateProps {
  title: string;
  message: string;
  buttonText?: string;
  onChangeSetup: () => void;
}

export const ErrorState = ({ title, message, buttonText = "Go Back", onChangeSetup }: ErrorStateProps) => {
  return (
    <PageContainer>
      <SetupHeader>
        <HeaderLogo onClick={onChangeSetup} />
      </SetupHeader>

      <SetupContentArea>
        <SetupFormWrapper>
          <SetupSectionTitle>Error</SetupSectionTitle>

          <ErrorCard>
            <CardContent>
              <ErrorTitle>{title}</ErrorTitle>
              <ErrorDescription>{message}</ErrorDescription>
            </CardContent>

            <ButtonSection>
              <GoBackButton onClick={onChangeSetup}>{buttonText}</GoBackButton>
            </ButtonSection>
          </ErrorCard>
        </SetupFormWrapper>
      </SetupContentArea>
    </PageContainer>
  );
};

// Error card
const ErrorCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const CardContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "24px",
});

const ErrorTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent0,
});

const ErrorDescription = styled(Typography)({
  fontSize: "13px",
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
});

// Button section
const ButtonSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "24px",
  borderTop: `1px dashed ${canonHeaderTokens.background.layer0}`,
});

const GoBackButton = styled(Button)({
  width: "100%",
  height: "36px",
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  borderRadius: "100px",
  border: "none",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#129035",
  },
});
