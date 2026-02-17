import { Box, styled } from "@mui/material";

export const StepPageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "32px 120px 64px",
  width: "100%",
  boxSizing: "border-box",
  [theme.breakpoints.down("lg")]: {
    padding: "24px 48px 56px",
  },
  [theme.breakpoints.down("md")]: {
    padding: "20px 24px 48px",
  },
  [theme.breakpoints.down("sm")]: {
    padding: "16px 12px 40px",
  },
}));

export const StepContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
  maxWidth: "576px",
});
