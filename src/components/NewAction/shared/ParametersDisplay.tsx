import { Box, Typography, styled } from "@mui/material";
import { CopyableText } from "~/components/shared/CopyButton";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import type { TransferFormData, SimpleActionFormData, CappedTransferHubFormData } from "../steps";

// Type guard to detect hub form data
export const isHubFormData = (
  data: TransferFormData | SimpleActionFormData | CappedTransferHubFormData,
): data is CappedTransferHubFormData => {
  return "tokens" in data && Array.isArray(data.tokens) && "epochLength" in data;
};

// Type guard to detect transfer form data
export const isTransferFormData = (
  data: TransferFormData | SimpleActionFormData | CappedTransferHubFormData,
): data is TransferFormData => {
  return "transfers" in data && Array.isArray(data.transfers);
};

// Type guard to detect simple action form data
export const isSimpleActionFormData = (
  data: TransferFormData | SimpleActionFormData | CappedTransferHubFormData,
): data is SimpleActionFormData => {
  return "actions" in data && Array.isArray(data.actions);
};

interface ParametersDisplayProps {
  formData: TransferFormData | SimpleActionFormData | CappedTransferHubFormData;
  onCopy?: (value: string) => void;
}

// Helper component for copyable parameter values
const CopyableValue = ({ value, fallback = "-" }: { value: string | undefined; fallback?: string }) => {
  if (!value) {
    return <ParameterValue>{fallback}</ParameterValue>;
  }
  return (
    <CopyableText text={value} iconSize={10} iconColor={canonHeaderTokens.foreground.accent10}>
      <ParameterValue>{value}</ParameterValue>
    </CopyableText>
  );
};

export const ParametersDisplay = ({ formData }: ParametersDisplayProps) => {
  if (isHubFormData(formData)) {
    // Hub parameters
    return (
      <ParametersContent>
        <ParameterRow>
          <ParameterLabel>Recipient</ParameterLabel>
          <CopyableValue value={formData.recipientAddress} />
        </ParameterRow>
        <ParameterRow>
          <ParameterLabel>Epoch</ParameterLabel>
          <CopyableValue value={formData.epochLength ? `${formData.epochLength} ${formData.epochUnit}` : undefined} />
        </ParameterRow>
        {formData.tokens.map((token, index) => (
          <Box key={index}>
            <ParameterRow>
              <ParameterLabel>Token {index + 1} Address</ParameterLabel>
              <CopyableValue value={token.address} />
            </ParameterRow>
            <ParameterRow $noBorder={index === formData.tokens.length - 1}>
              <ParameterLabel>Token {index + 1} Amount</ParameterLabel>
              <CopyableValue value={token.amount} />
            </ParameterRow>
          </Box>
        ))}
      </ParametersContent>
    );
  }

  if (isSimpleActionFormData(formData)) {
    // Simple Action parameters (multiple actions)
    return (
      <ParametersContent>
        {formData.actions.map((action, index) => (
          <Box key={index}>
            {formData.actions.length > 1 && <SectionHeader $isFirst={index === 0}>ACTION {index + 1}</SectionHeader>}
            <ParameterRow $noBorder={index === 0 && formData.actions.length === 1}>
              <ParameterLabel>Target Address</ParameterLabel>
              <CopyableValue value={action.target} />
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Signature</ParameterLabel>
              <CopyableValue value={action.signature} />
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Data</ParameterLabel>
              <CopyableValue value={action.data} fallback='0x' />
            </ParameterRow>
            <ParameterRow $noBorder={index === formData.actions.length - 1}>
              <ParameterLabel>Value (wei)</ParameterLabel>
              <CopyableValue value={action.value} fallback='0' />
            </ParameterRow>
          </Box>
        ))}
      </ParametersContent>
    );
  }

  // Transfer parameters (multiple transfers)
  return (
    <ParametersContent>
      {formData.transfers.map((transfer, index) => (
        <Box key={index}>
          {formData.transfers.length > 1 && <SectionHeader $isFirst={index === 0}>TRANSFER {index + 1}</SectionHeader>}
          <ParameterRow $noBorder={index === 0 && formData.transfers.length === 1}>
            <ParameterLabel>Token Address</ParameterLabel>
            <CopyableValue value={transfer.tokenAddress} />
          </ParameterRow>
          <ParameterRow>
            <ParameterLabel>Recipient Address</ParameterLabel>
            <CopyableValue value={transfer.recipientAddress} />
          </ParameterRow>
          <ParameterRow $noBorder={index === formData.transfers.length - 1}>
            <ParameterLabel>Amount</ParameterLabel>
            <CopyableValue value={transfer.amount} />
          </ParameterRow>
        </Box>
      ))}
    </ParametersContent>
  );
};

// Styled components
const ParametersContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  backgroundColor: canonHeaderTokens.background.layer1,
});

const SectionHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isFirst",
})<{ $isFirst?: boolean }>(({ $isFirst }) => ({
  padding: "12px 16px 12px 36px",
  backgroundColor: canonHeaderTokens.background.layer1Variation,
  borderTop: $isFirst ? "none" : `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
}));

const ParameterRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$noBorder",
})<{ $noBorder?: boolean }>(({ $noBorder }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "16px 16px 16px 36px",
  borderTop: $noBorder ? "none" : `0.5px solid ${canonHeaderTokens.foreground.accent50}`,
}));

const ParameterLabel = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ParameterValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent0,
  fontFamily: "monospace",
  wordBreak: "break-all",
});
