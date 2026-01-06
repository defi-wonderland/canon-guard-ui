import { Box, Typography, Button, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { HeaderLogo } from "./Header";

interface ErrorStateProps {
  title: string;
  message: string;
  buttonText?: string;
  onChangeSetup: () => void;
}

export const ErrorState = ({ title, message, buttonText = "Go Back", onChangeSetup }: ErrorStateProps) => {
  return (
    <PageContainer>
      <Header>
        <HeaderLogo onClick={onChangeSetup} />
      </Header>

      <ContentArea>
        <FormWrapper>
          <SectionTitle>ERROR</SectionTitle>

          <ErrorCard>
            <CardContent>
              <ErrorTitle>{title}</ErrorTitle>
              <ErrorDescription>{message}</ErrorDescription>
            </CardContent>

            <ButtonSection>
              <GoBackButton onClick={onChangeSetup}>{buttonText.toUpperCase()}</GoBackButton>
            </ButtonSection>
          </ErrorCard>
        </FormWrapper>
      </ContentArea>
    </PageContainer>
  );
};

// Page layout (matching landing page)
const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const Header = styled(Box)({
  display: "flex",
  alignItems: "center",
  height: "72px",
  backgroundColor: canonHeaderTokens.background.layer1,
  width: "100%",
});

const ContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 120px 64px",
});

const FormWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
  maxWidth: "576px",
});

const SectionTitle = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent30,
  padding: "8px",
});

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
