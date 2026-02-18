import { useEffect, useRef } from "react";
import { Box, styled } from "@mui/material";
import { ZapIcon } from "~/components/icons";
import { DurationInput } from "~/components/shared/DurationInput";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeaderWithClose,
  ModalDescription,
  ModalButtonRow,
  ModalCancelButton,
  ModalSubmitButton,
  ModalErrorText,
  ModalInputLabel,
  ModalInputSection,
} from "~/components/shared/ModalComponents";
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
    <ModalOverlay>
      <ModalContainer ref={modalRef}>
        <ModalHeaderWithClose
          title='Pre-Approve Action'
          icon={<ZapIcon size={18} color={canonHeaderTokens.brand.green} />}
          onClose={onClose}
        />

        {actionLabel && (
          <ActionLabelRow>
            <ActionLabelText>Action: {actionLabel}</ActionLabelText>
          </ActionLabelRow>
        )}

        <ModalDescription>
          Set the duration for this pre-approval. Once deployed, the action can be executed without additional
          signatures during this period.
        </ModalDescription>

        <ModalInputSection>
          <ModalInputLabel>Duration</ModalInputLabel>
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
              <ModalErrorText>{errorMessage}</ModalErrorText>
            </DurationError>
          )}
        </ModalInputSection>

        <ModalButtonRow>
          <ModalCancelButton onClick={onClose}>CANCEL</ModalCancelButton>
          <ModalSubmitButton onClick={handleSubmit} disabled={!isValid || isLoadingMax}>
            CONTINUE
          </ModalSubmitButton>
        </ModalButtonRow>
      </ModalContainer>
    </ModalOverlay>
  );
};

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

const DurationError = styled(Box)({
  display: "flex",
  alignItems: "center",
});
