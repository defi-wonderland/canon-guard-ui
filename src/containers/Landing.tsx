import { Typography, Box, styled } from "@mui/material";
import { DISCLAIMER_HEIGHT, SURROUND_HEIGHT } from "~/utils";

export const Landing = () => {
  return (
    <LandingContainer>
      <LandingContent>
        <LandingTitle variant='h3'>Canon Guard</LandingTitle>
        <LandingSubtitle variant='h6'>View-only interface for Canon Guard management</LandingSubtitle>
      </LandingContent>
    </LandingContainer>
  );
};

const LandingContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  height: `calc(100vh - ${SURROUND_HEIGHT}rem - ${DISCLAIMER_HEIGHT}rem)`,
  padding: "0 8rem",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
});

const LandingContent = styled(Box)(() => ({
  textAlign: "center",
  maxWidth: 600,
}));

const LandingTitle = styled(Typography)(() => ({
  fontWeight: 700,
  marginBottom: 16,
}));

const LandingSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: 32,
}));
