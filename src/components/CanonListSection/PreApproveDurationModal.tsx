import { useEffect, useRef } from "react";
import { Box, styled } from "@mui/material";
import { XIcon, ZapIcon } from "~/components/icons";
import { DurationInput } from "~/components/shared/DurationInput";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useModalClose, usePreApprovalDuration } from "~/hooks";
import type { Address } from "viem";

interface PreApproveDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (durationSeconds: bigint) => void;
  actionLabel?: string;
  guardAddress: Address | null;
  chainId: number | null;
}

export const PreApproveDurationModal = ({
  isOpen,
  onClose,
  onSubmit,
  actionLabel,
  guardAddress,
  chainId,
}: PreApproveDurationModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    durationAmount,
    setDurationAmount,
    durationUnit,
    setDurationUnit,
    totalDurationSeconds,
    isValid,
    errorMessage,
    isLoading: isLoadingMax,
  } = usePreApprovalDuration(guardAddress, chainId, isOpen);

  useModalClose(isOpen, onClose, modalRef);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDurationAmount("1");
      setDurationUnit("hours");
    }
  }, [isOpen, setDurationAmount, setDurationUnit]);

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(totalDurationSeconds);
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer ref={modalRef}>
        <ModalHeader>
          <HeaderLeft>
            <IconWrapper>
              <ZapIcon size={18} color={canonHeaderTokens.brand.green} />
            </IconWrapper>
            <ModalTitle>Pre-Approve Action</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <XIcon size={18} color={canonHeaderTokens.foreground.accent20} />
          </CloseButton>
        </ModalHeader>

        {actionLabel && (
          <ActionLabelRow>
            <ActionLabelText>Action: {actionLabel}</ActionLabelText>
          </ActionLabelRow>
        )}

        <ModalDescription>
          Set the duration for this pre-approval. Once deployed, the action can be executed without additional
          signatures during this period.
        </ModalDescription>

        <DurationInputSection>
          <DurationLabel>Duration</DurationLabel>
          <DurationInput
            value={durationAmount}
            unit={durationUnit}
            onValueChange={setDurationAmount}
            onUnitChange={setDurationUnit}
            hasError={!isValid && durationAmount !== ""}
            placeholder='Enter duration'
            excludeUnits={["seconds"]}
          />
          {!isValid && errorMessage && (
            <DurationError>
              <ErrorText>{errorMessage}</ErrorText>
            </DurationError>
          )}
        </DurationInputSection>

        <ButtonRow>
          <CancelButton onClick={onClose}>CANCEL</CancelButton>
          <SubmitButton onClick={handleSubmit} disabled={!isValid || isLoadingMax}>
            CONTINUE
          </SubmitButton>
        </ButtonRow>
      </ModalContainer>
    </Overlay>
  );
};

const Overlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
});

const ModalContainer = styled(Box)({
  width: "420px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.3), 0px 8px 10px -6px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
});

const ModalHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 12px 24px",
});

const HeaderLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const IconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const ModalTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
});

const CloseButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const ActionLabelRow = styled(Box)({
  padding: "0 24px 8px 24px",
});

const ActionLabelText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
});

const ModalDescription = styled("p")({
  margin: 0,
  padding: "0 24px 20px 24px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

const DurationInputSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "0 24px 24px 24px",
});

const DurationLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const DurationError = styled(Box)({
  display: "flex",
  alignItems: "center",
});

const ErrorText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
});

const ButtonRow = styled(Box)({
  display: "flex",
  gap: "12px",
  padding: "0 24px 24px 24px",
});

const CancelButton = styled("button")({
  flex: 1,
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: "transparent",
  color: canonHeaderTokens.foreground.accent10,
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const SubmitButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: disabled ? 0.6 : 0.9,
  },
}));
