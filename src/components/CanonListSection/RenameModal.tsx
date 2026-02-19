import { useState, useEffect, useRef, useMemo } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { SquarePenIcon } from "~/components/icons";
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
import { useModalClose } from "~/hooks";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newLabel: string) => void;
  currentLabel: string;
  isLoading?: boolean;
}

export const RenameModal = ({ isOpen, onClose, onSubmit, currentLabel, isLoading = false }: RenameModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [newLabel, setNewLabel] = useState<string>(currentLabel);

  const { isValid, errorMessage } = useMemo(() => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      return { isValid: false, errorMessage: "Name cannot be empty" };
    }
    return { isValid: true, errorMessage: null };
  }, [newLabel]);

  useModalClose(isOpen, onClose, modalRef);

  useEffect(() => {
    if (isOpen) {
      setNewLabel(currentLabel);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentLabel]);

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    onSubmit(newLabel.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContainer ref={modalRef}>
        <ModalHeaderWithClose
          title='Rename Action'
          icon={<SquarePenIcon size={18} color={canonHeaderTokens.brand.green} />}
          onClose={onClose}
        />

        <ModalDescription>
          Enter a new name for this action. This will update the label in the Canon List.
        </ModalDescription>

        <ModalInputSection>
          <ModalInputLabel>Name</ModalInputLabel>
          <NameInput
            ref={inputRef}
            type='text'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Enter action name'
            $hasError={!isValid && newLabel !== currentLabel}
            disabled={isLoading}
          />
          {!isValid && errorMessage && newLabel !== currentLabel && (
            <InputError>
              <ModalErrorText>{errorMessage}</ModalErrorText>
            </InputError>
          )}
        </ModalInputSection>

        <ModalButtonRow>
          <ModalCancelButton onClick={onClose} disabled={isLoading}>
            CANCEL
          </ModalCancelButton>
          <ModalSubmitButton onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "SAVE"}
          </ModalSubmitButton>
        </ModalButtonRow>
      </ModalContainer>
    </ModalOverlay>
  );
};

const NameInput = styled("input")<{ $hasError?: boolean }>(({ $hasError }) => ({
  width: "100%",
  height: "40px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `1px solid ${$hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: $hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent20,
  },
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
}));

const InputError = styled(Box)({
  display: "flex",
  alignItems: "center",
});
