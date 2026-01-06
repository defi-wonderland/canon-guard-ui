import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Tooltip,
  IconButton,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { isAddress } from "viem";
import { CANON_GUARD_FACTORY, MULTI_SEND_CALL_ONLY } from "~/constants/addresses";
import { SafeInfo } from "~/types";

interface GuardSetupWizardProps {
  safeInfo: SafeInfo;
  onBack: () => void;
}

interface SetupParams {
  shortTxExecutionDelay: string;
  longTxExecutionDelay: string;
  txExpiryDelay: string;
  maxApprovalDuration: string;
  emergencyTrigger: string;
  emergencyCaller: string;
}

const DEFAULT_VALUES: SetupParams = {
  shortTxExecutionDelay: "3600", // 1 hour
  longTxExecutionDelay: "604800", // 7 days
  txExpiryDelay: "604800", // 7 days
  maxApprovalDuration: "126227808", // ~4 years
  emergencyTrigger: "",
  emergencyCaller: "",
};

const PARAM_INFO = {
  shortTxExecutionDelay: {
    label: "Short Execution Delay",
    description: "Time delay for pre-approved transactions (in seconds). Recommended: 1 hour (3600)",
    placeholder: "3600",
  },
  longTxExecutionDelay: {
    label: "Long Execution Delay",
    description: "Time delay for non-pre-approved transactions (in seconds). Recommended: 7 days (604800)",
    placeholder: "604800",
  },
  txExpiryDelay: {
    label: "Transaction Expiry Delay",
    description:
      "How long a transaction remains executable after becoming eligible (in seconds). Recommended: 7 days (604800)",
    placeholder: "604800",
  },
  maxApprovalDuration: {
    label: "Maximum Approval Duration",
    description:
      "Maximum time an action builder or hub can be pre-approved (in seconds). Recommended: ~4 years (126227808)",
    placeholder: "126227808",
  },
  emergencyTrigger: {
    label: "Emergency Trigger Address",
    description: "Address that can activate emergency mode. Recommended: Another multisig you control",
    placeholder: "0x...",
  },
  emergencyCaller: {
    label: "Emergency Caller Address",
    description:
      "Address that can execute transactions during emergency mode. Recommended: Another multisig you control",
    placeholder: "0x...",
  },
};

const steps = ["Configure Parameters", "Deploy Canon Guard", "Attach Guard"];

export const GuardSetupWizard = ({ safeInfo, onBack }: GuardSetupWizardProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [params, setParams] = useState<SetupParams>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Partial<SetupParams>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const validateParams = (): boolean => {
    const newErrors: Partial<SetupParams> = {};

    // Validate numeric fields
    const numericFields: (keyof SetupParams)[] = [
      "shortTxExecutionDelay",
      "longTxExecutionDelay",
      "txExpiryDelay",
      "maxApprovalDuration",
    ];

    for (const field of numericFields) {
      const value = params[field];
      if (!value || isNaN(Number(value)) || Number(value) < 0) {
        newErrors[field] = "Must be a positive number";
      }
    }

    // Validate short <= long delay
    if (Number(params.shortTxExecutionDelay) > Number(params.longTxExecutionDelay)) {
      newErrors.shortTxExecutionDelay = "Short delay cannot be greater than long delay";
    }

    // Validate address fields
    if (!params.emergencyTrigger || !isAddress(params.emergencyTrigger)) {
      newErrors.emergencyTrigger = "Must be a valid Ethereum address";
    }
    if (!params.emergencyCaller || !isAddress(params.emergencyCaller)) {
      newErrors.emergencyCaller = "Must be a valid Ethereum address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateParams()) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBack();
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleParamChange = (field: keyof SetupParams, value: string) => {
    setParams((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const renderConfigStep = () => (
    <Box display='flex' flexDirection='column' gap={3}>
      <Alert severity='info' sx={{ mb: 2 }}>
        This Safe does not have a Canon Guard attached. Configure the parameters below to deploy one.
      </Alert>

      {(Object.keys(PARAM_INFO) as (keyof typeof PARAM_INFO)[]).map((field) => (
        <TextField
          key={field}
          fullWidth
          label={PARAM_INFO[field].label}
          placeholder={PARAM_INFO[field].placeholder}
          value={params[field]}
          onChange={(e) => handleParamChange(field, e.target.value)}
          error={!!errors[field]}
          helperText={errors[field] || PARAM_INFO[field].description}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Tooltip title={PARAM_INFO[field].description}>
                  <IconButton size='small'>
                    <InfoOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      ))}
    </Box>
  );

  const renderDeployStep = () => (
    <Box display='flex' flexDirection='column' gap={3}>
      <Alert severity='warning' sx={{ mb: 2 }}>
        Deploy the Canon Guard using the Safe Transaction Builder or directly via the contract. Copy the parameters
        below and use them in your deployment.
      </Alert>

      <Typography variant='h6' gutterBottom>
        Deployment Parameters
      </Typography>

      <ParameterRow>
        <ParameterLabel>Target Contract:</ParameterLabel>
        <ParameterValue>
          <code>{CANON_GUARD_FACTORY}</code>
          <CopyButton onClick={() => handleCopy(CANON_GUARD_FACTORY, "factory")}>
            <ContentCopyIcon fontSize='small' />
            {copied === "factory" && <CopiedText>Copied!</CopiedText>}
          </CopyButton>
        </ParameterValue>
      </ParameterRow>

      <ParameterRow>
        <ParameterLabel>Function:</ParameterLabel>
        <ParameterValue>
          <code>createCanonGuard</code>
        </ParameterValue>
      </ParameterRow>

      <Typography variant='subtitle2' sx={{ mt: 2, mb: 1 }}>
        Function Parameters:
      </Typography>

      <ParametersBox>
        <ParameterItem>
          <span>_safe:</span>
          <code>{safeInfo.address}</code>
          <CopyButton onClick={() => handleCopy(safeInfo.address, "safe")}>
            <ContentCopyIcon fontSize='small' />
          </CopyButton>
        </ParameterItem>
        <ParameterItem>
          <span>_multiSendCallOnly:</span>
          <code>{MULTI_SEND_CALL_ONLY}</code>
          <CopyButton onClick={() => handleCopy(MULTI_SEND_CALL_ONLY, "multisend")}>
            <ContentCopyIcon fontSize='small' />
          </CopyButton>
        </ParameterItem>
        <ParameterItem>
          <span>_shortTxExecutionDelay:</span>
          <code>{params.shortTxExecutionDelay}</code>
        </ParameterItem>
        <ParameterItem>
          <span>_longTxExecutionDelay:</span>
          <code>{params.longTxExecutionDelay}</code>
        </ParameterItem>
        <ParameterItem>
          <span>_txExpiryDelay:</span>
          <code>{params.txExpiryDelay}</code>
        </ParameterItem>
        <ParameterItem>
          <span>_maxApprovalDuration:</span>
          <code>{params.maxApprovalDuration}</code>
        </ParameterItem>
        <ParameterItem>
          <span>_emergencyTrigger:</span>
          <code>{params.emergencyTrigger}</code>
        </ParameterItem>
        <ParameterItem>
          <span>_emergencyCaller:</span>
          <code>{params.emergencyCaller}</code>
        </ParameterItem>
      </ParametersBox>

      <Alert severity='info' sx={{ mt: 2 }}>
        After deploying, save the Canon Guard address. You'll need it in the next step.
      </Alert>
    </Box>
  );

  const renderAttachStep = () => (
    <Box display='flex' flexDirection='column' gap={3}>
      <Alert severity='info' sx={{ mb: 2 }}>
        After deploying your Canon Guard, you need to attach it to your Safe. This requires a Safe transaction to call{" "}
        <code>setGuard</code> with the deployed Canon Guard address.
      </Alert>

      <Typography variant='body1' paragraph>
        To attach the Canon Guard:
      </Typography>

      <Box component='ol' sx={{ pl: 3 }}>
        <li>
          <Typography variant='body2' paragraph>
            Go to your Safe's Transaction Builder
          </Typography>
        </li>
        <li>
          <Typography variant='body2' paragraph>
            Create a transaction calling <code>setGuard(address)</code> on your Safe contract
          </Typography>
        </li>
        <li>
          <Typography variant='body2' paragraph>
            Pass the deployed Canon Guard address as the parameter
          </Typography>
        </li>
        <li>
          <Typography variant='body2' paragraph>
            Sign and execute the transaction with your Safe signers
          </Typography>
        </li>
      </Box>

      <Alert severity='warning'>
        Once attached, all Safe transactions will be routed through Canon Guard. Make sure you have tested the Canon
        Guard deployment before attaching.
      </Alert>

      <Box display='flex' gap={2} mt={2}>
        <Button variant='outlined' onClick={onBack}>
          Go Back to Start
        </Button>
      </Box>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderConfigStep();
      case 1:
        return renderDeployStep();
      case 2:
        return renderAttachStep();
      default:
        return null;
    }
  };

  return (
    <WizardContainer>
      <WizardContent>
        <WizardHeader>
          <Typography variant='h4' fontWeight={600} gutterBottom>
            Setup Canon Guard
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Configure and deploy Canon Guard for your Safe
          </Typography>
        </WizardHeader>

        <SafeInfoBox>
          <Typography variant='subtitle2' color='text.secondary'>
            Safe Address
          </Typography>
          <Typography variant='body2' fontFamily='monospace'>
            {safeInfo.address}
          </Typography>
          <Box display='flex' gap={2} mt={1}>
            <Typography variant='caption' color='text.secondary'>
              Network: {safeInfo.network}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Threshold: {safeInfo.threshold}/{safeInfo.totalOwners}
            </Typography>
          </Box>
        </SafeInfoBox>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        {activeStep < 2 && (
          <ButtonRow>
            <Button variant='outlined' onClick={handleBack}>
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>
            <Button variant='contained' onClick={handleNext}>
              {activeStep === 1 ? "I've Deployed" : "Next"}
            </Button>
          </ButtonRow>
        )}
      </WizardContent>
    </WizardContainer>
  );
};

const WizardContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  minHeight: "100vh",
  padding: "2rem",
});

const WizardContent = styled(Paper)(({ theme }) => ({
  maxWidth: 700,
  width: "100%",
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
}));

const WizardHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SafeInfoBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
}));

const ButtonRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginTop: theme.spacing(4),
}));

const ParameterRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
}));

const ParameterLabel = styled(Typography)({
  fontWeight: 600,
  minWidth: 150,
});

const ParameterValue = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  "& code": {
    fontFamily: "monospace",
    fontSize: "0.875rem",
  },
});

const ParametersBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontFamily: "monospace",
  fontSize: "0.875rem",
}));

const ParameterItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 0),
  "& span": {
    color: theme.palette.text.secondary,
    minWidth: 200,
  },
  "& code": {
    wordBreak: "break-all",
  },
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  padding: 4,
  marginLeft: theme.spacing(1),
}));

const CopiedText = styled("span")(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.success.main,
  marginLeft: theme.spacing(0.5),
}));
