import { Box, styled } from "@mui/material";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { SafeInfo } from "~/types";
import { Footer } from "./Footer";
import { HeaderLogo } from "./Header";
import { CircleFadingPlusIcon, Link2Icon } from "./icons";
import { SafeProfileCard } from "./shared/SafeProfileCard";
import {
  PageContainer,
  SetupHeader,
  SetupContentArea,
  SetupFormWrapper,
  SetupSectionTitle,
} from "./shared/StyledComponents";

interface NoGuardChoiceScreenProps {
  safeInfo: SafeInfo;
  onDeployNew: () => void;
  onUseExisting: () => void;
  onBack: () => void;
}

export const NoGuardChoiceScreen = ({ safeInfo, onDeployNew, onUseExisting, onBack }: NoGuardChoiceScreenProps) => {
  return (
    <PageContainer>
      <SetupHeader>
        <HeaderLogo onClick={onBack} />
      </SetupHeader>

      <SetupContentArea>
        <SetupFormWrapper>
          <SetupSectionTitle>Add New Safe Account</SetupSectionTitle>

          {/* Safe Profile Card */}
          <SafeProfileCard address={safeInfo.address} chainId={safeInfo.chainId} />

          {/* Choice Card */}
          <ChoiceCard>
            <InfoSection>
              <InfoText data-testid='no-guard-message'>
                It looks like your Safe doesn't have a Canon Guard set. Choose how you'd like to proceed:
              </InfoText>
            </InfoSection>

            <OptionsSection>
              <OptionButton onClick={onDeployNew} data-testid='deploy-new-guard-button'>
                <OptionIconWrapper>
                  <CircleFadingPlusIcon size={20} color={canonHeaderTokens.foreground.accent0} />
                </OptionIconWrapper>
                <OptionContent>
                  <OptionTitle>Deploy New Canon Guard</OptionTitle>
                  <OptionDescription>
                    Create and deploy a new Canon Guard for your Safe with custom parameters.
                  </OptionDescription>
                </OptionContent>
              </OptionButton>

              <OptionButton onClick={onUseExisting} data-testid='use-existing-guard-button'>
                <OptionIconWrapper>
                  <Link2Icon size={20} color={canonHeaderTokens.foreground.accent0} />
                </OptionIconWrapper>
                <OptionContent>
                  <OptionTitle>Use Existing Canon Guard</OptionTitle>
                  <OptionDescription>
                    Connect to an already deployed Canon Guard without attaching it to your Safe.
                  </OptionDescription>
                </OptionContent>
              </OptionButton>
            </OptionsSection>

            <ButtonSection>
              <BackButton onClick={onBack}>BACK</BackButton>
            </ButtonSection>
          </ChoiceCard>
        </SetupFormWrapper>
      </SetupContentArea>

      <Footer />
    </PageContainer>
  );
};

// Choice Card
const ChoiceCard = styled(Box)({
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const InfoSection = styled(Box)({
  padding: "24px",
});

const InfoText = styled("p")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent10,
  margin: 0,
});

const OptionsSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "0 24px 24px",
});

const OptionButton = styled("button")({
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "8px",
  cursor: "pointer",
  textAlign: "left",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: canonHeaderTokens.foreground.accent20,
    backgroundColor: canonHeaderTokens.background.layer0,
  },
});

const OptionIconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  backgroundColor: canonHeaderTokens.background.layer1,
  flexShrink: 0,
});

const OptionContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

const OptionTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
});

const OptionDescription = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ButtonSection = styled(Box)({
  display: "flex",
  justifyContent: "center",
  padding: "24px",
  borderTop: `1px dashed ${canonHeaderTokens.foreground.accent50}`,
});

const BackButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  height: "36px",
  padding: "8px 20px",
  borderRadius: "100px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: canonHeaderTokens.foreground.accent10,
  "&:hover": {
    backgroundColor: `${canonHeaderTokens.foreground.accent40}20`,
  },
});
