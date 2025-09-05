import { Box, Typography, Button, styled } from "@mui/material";

interface ErrorStateProps {
  title: string;
  message: string;
  onChangeSetup: () => void;
}

export const ErrorState = ({ title, message, onChangeSetup }: ErrorStateProps) => {
  return (
    <ErrorContainer>
      <ErrorContent>
        <ErrorTitle variant='h4'>{title}</ErrorTitle>
        <ErrorDescription variant='body1'>{message}</ErrorDescription>
        <ErrorActions>
          <ChangeSetupButton variant='contained' onClick={onChangeSetup}>
            Change Setup
          </ChangeSetupButton>
        </ErrorActions>
      </ErrorContent>
    </ErrorContainer>
  );
};

const ErrorContainer = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  padding: 32,
}));

const ErrorContent = styled(Box)(({ theme }) => ({
  maxWidth: 600,
  textAlign: "center",
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
}));

const ErrorTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
}));

const ErrorDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
  lineHeight: 1.6,
}));

const ErrorActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(1),
}));

const ChangeSetupButton = styled(Button)(() => ({
  minWidth: 120,
  fontWeight: 600,
}));
